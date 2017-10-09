import fetch from 'sketch-polyfill-fetch-babel-safe'
import { assign } from 'lodash'
import { download, upload } from './request'
import { getJiraHost, getBearerToken } from './auth'
import jqlFilters from './jql-filters'
import { issueFromRest } from './entity-mappers'
import { standardIssueFields, maxMentionPickerResults } from './config'
import { trace, isTraceEnabled } from './logger'
import FaqError, {faqTopics} from './error/FaqError'
import AuthorizationError from './error/AuthorizationError'

/**
 * Handles interaction with Jira's REST API.
 */
export default class Jira {
  constructor () {
    this.baseUrl = `https://${getJiraHost()}`
    this.apiRoot = `${this.baseUrl}/rest/api/2`
  }

  /**
   * @param {string} filterKey the key of a `jql-filter` to use to search for
   * issues
   * @param {Object} opts search options
   * @param {string[]} [opts.fields] issue fields to return
   * @param {number} [opts.startAt] paging, index to start at
   * @param {number} [opts.maxResults] paging, max number of results to return
   * @return {Promise<object[]>} an array of Jira issues (see `entity-mappers`)
   * @see https://docs.atlassian.com/jira/REST/cloud/#api/2/search
   */
  async getFilteredIssues (filterKey, opts) {
    const filter = jqlFilters[filterKey]
    if (!filter) {
      throw new Error(`No filter defined for ${filterKey}`)
    }
    opts = assign({ fields: standardIssueFields }, opts)
    const jql = encodeURIComponent(filter.jql)
    let searchUrl = `${this.apiRoot}/search?jql=${jql}&fields=${opts.fields.join(',')}`
    if (opts.startAt) {
      searchUrl += `&startAt=${opts.startAt}`
    }
    if (opts.maxResults) {
      searchUrl += `&maxResults=${opts.maxResults}`
    }
    return (await jiraFetch(searchUrl)).issues.map(issueFromRest)
  }

  /**
   * @param {string} issueKey identifies the issue to retrieve
   * @param {Object} opts request options
   * @param {string[]} [opts.fields] issue fields to return
   * @param {boolean} [opts.updateHistory] whether to update Jira's 'recent issues'
   * list based on this request
   * @return {Promise<object>} a Jira issue (see `entity-mappers`)
   * @see https://docs.atlassian.com/jira/REST/cloud/#api/2/issue-getIssue
   */
  async getIssue (issueKey, opts) {
    opts = assign({ fields: standardIssueFields }, opts)
    let issueUrl = `${this.apiRoot}/issue/${issueKey}?fields=${opts.fields.join(',')}`
    if (opts.updateHistory) {
      issueUrl += '&updateHistory=true'
    }
    return issueFromRest(await jiraFetch(issueUrl))
  }

  /**
   * @param {string} issueKey identifies the issue to retrieve
   * @return {Promise<object[]>} an array of watchers. Note, if the user does
   * not have permission to view watchers, users other than themselves will be
   * omitted from the array.
   * @see https://docs.atlassian.com/jira/REST/cloud/#api/2/issue-getIssueWatchers
   */
  async getWatchers (issueKey) {
    let watchers
    try {
      watchers = (await jiraFetch(`${this.apiRoot}/issue/${issueKey}/watchers`)).watchers
    } catch (e) {
      // ASP-71: Jira sometimes returns a 200 with an empty response :|
      if (e.message == 'JSON Parse error: Unexpected EOF') {
        trace(e)
        watchers = []
      } else {
        throw e
      }
    }
    return watchers
  }

  /**
   * Note: this buffers the image into memory, so should only be used for
   * small images like icons and thumbnails. The request will be authenticated
   * only if the supplied URL matches the base url of the connected Jira
   * instance.
   *
   * @param {string} url the url of an image
   * @param {string} mimeType the expected mime type of the image
   */
  async getImageAsDataUri (url, mimeType) {
    const opts = {}
    // only authenticate requests to Jira
    if (url.indexOf(this.baseUrl) == 0) {
      opts.headers = {
        Authorization: await authHeader()
      }
    }
    const res = await fetch(url, opts)
    let data = await res.blob()
    data = data.base64EncodedDataWithOptions(null)
    data = NSString.alloc().initWithData_encoding(data, NSUTF8StringEncoding)
    return `data:${mimeType};base64,${data}`
  }

  /**
   * Downloads an attachment to the user's configured Downloads directory.
   *
   * @param {string} url the URL of an attachment to download
   * @param {string} filename a the filename to save the attachment as
   * @param {function} progress a callback for reporting progress. It is
   * periodically invoked with two parameters: (downloadedBytes, totalBytes)
   * @return {Promise<string>} the path to the downloaded file
   */
  async downloadAttachment (url, filename, progress) {
    const opts = {
      filename,
      headers: {
        Authorization: await authHeader()
      }
    }
    try {
      return await download(url, opts, progress)
    } catch (e) {
      handleHttpError(e)
    }
  }

  /**
   * @param {string} issueKey identifies the issue to attach the file to
   * @param {string} filePath the file to upload
   * @param {function} progress a callback for reporting progress. It is
   * periodically invoked with two parameters: (uploadedBytes, totalBytes)
   * @return {Promise<object>} a JSON representation of the uploaded attachment
   * @see https://docs.atlassian.com/jira/REST/cloud/#api/2/issue/{issueIdOrKey}/attachments-addAttachment
   */
  async uploadAttachment (issueKey, filePath, progress) {
    const uploadUrl = `${this.apiRoot}/issue/${issueKey}/attachments`
    const opts = {
      filePath: filePath,
      headers: {
        Authorization: await authHeader(),
        'X-Atlassian-Token': 'no-check'
      }
    }
    try {
      return await upload(uploadUrl, opts, progress)
    } catch (e) {
      handleHttpError(e)
    }
  }

  /**
   * @param {string} id identifies the attachment to delete
   * @see https://docs.atlassian.com/jira/REST/cloud/#api/2/attachment-removeAttachment
   */
  async deleteAttachment (id) {
    return jiraFetch(`${this.apiRoot}/attachment/${id}`, {method: 'DELETE'})
  }

  /**
   * @param {string} issueKey identifies the issue to comment on
   * @param {string} comment the comment text
   * @return {Promise<string>} a permalink to the comment
   * @see https://docs.atlassian.com/jira/REST/cloud/#api/2/issue/{issueIdOrKey}/comment-addComment
   */
  async addComment (issueKey, comment) {
    const commentUrl = `${this.apiRoot}/issue/${issueKey}/comment`
    const body = JSON.stringify({body: comment})
    const commentJson = await jiraFetch(commentUrl, {method: 'POST', body})
    return commentPermalink(issueKey, commentJson)
  }

  /**
   * @return {Promise<object>} the user's profile
   * @see https://docs.atlassian.com/jira/REST/cloud/#api/2/myself-getUser
   */
  async getProfile () {
    return jiraFetch(`${this.apiRoot}/myself`)
  }

  /**
   * @param {string} query a search string matching user meta data
   * @param {Object} opts search options
   * @param {number} [opts.maxResults] paging, max number of results to return
   * @param {boolean} [opts.showAvatar] whether user avatars should be returned
   * @return {Promise<object>} user picker results matching the search criteria
   * @see https://docs.atlassian.com/jira/REST/cloud/#api/2/user-findUsersForPicker
   */
  async findUsersForPicker (query, opts) {
    opts = assign({
      maxResults: maxMentionPickerResults,
      showAvatar: true
    }, opts)
    let pickerUrl = `${this.apiRoot}/user/picker?query=${encodeURIComponent(query)}`
    if (opts.maxResults) {
      pickerUrl += `&maxResults=${opts.maxResults}`
    }
    if (opts.showAvatar) {
      pickerUrl += '&showAvatar=true'
    }
    return (await jiraFetch(pickerUrl)).users
  }
}

/**
 * Make a REST request to Jira.
 *
 * @param {string} url the absolute URL to the REST resource
 * @param {Object} [opts] request options. Some are documented here, some are
 * passed through to `sketch-polyfill-fetch-babel-safe`
 * @param {string} [opts.method] request method (defaults to GET)
 * @param {Object} [opts.headers] request headers
 * @param {string} [opts.body] the request body
 * @throws specialized exceptions depending on the error case. A `FaqError`
 * will be thrown with a suitable `faqTopic` for anticipated errors. An
 * `AuthorizationError` will be thrown for authentication or authorization
 * errors. Other errors may be thrown for other error cases.
 */
async function jiraFetch (url, opts) {
  opts = opts || {}
  const headers = assign({
    Accept: 'application/json',
    Authorization: await authHeader()
  }, opts.headers)
  if (opts.body) {
    headers['Content-Type'] = 'application/json'
  }
  opts = assign({}, opts, {headers})
  const res = await fetch(url, opts)
  trace(`${res.status} from ${opts.method || 'GET'} ${url}`)
  if (!res.ok) {
    try {
      trace(`Response text: ${await res.text()}`)
    } catch (e) {
      trace('Failed to parse response body as text')
    }
    tryHandleHttpStatus(res.status)
    if (res.status == 400 && await doesItLooksLikeAPermissionProblem(res)) {
      throwPermissionsError()
    }
    throw new Error(`Jira responded with: ${res.status} ${res.statusText}`)
  }
  if (res.status != 204) {
    try {
      const json = await res.json()
      isTraceEnabled() &&
        trace(`body from ${opts.method || 'GET'} ${url}\n${JSON.stringify(json, null, 2)}`)
      return json
    } catch (e) {
      try {
        isTraceEnabled() && trace(`Failed to parse body as JSON: ${await res.text()}`)
      } catch (ignored) {}
      throw e
    }
  }
}

/**
 * @return {Promise<string>} a bearer token for the connected Jira instance, formatted
 * for use in an Authorization HTTP header.
 */
async function authHeader () {
  return 'Bearer ' + (await getBearerToken())
}

/**
 * @param {string} issueKey identifies the issue containing the comment
 * @param {string} commentJson a REST JSON representation of a comment
 * @return {string} a permalink to the comment
 */
function commentPermalink (issueKey, commentJson) {
  const baseUrl = commentJson.self.substring(0, commentJson.self.indexOf('/rest/'))
  const commentId = commentJson.id
  const path = `${baseUrl}/browse/${issueKey}`
  const query = `?focusedCommentId=${commentId}` +
                '&page=com.atlassian.jira.plugin.system.issuetabpanels%3Acomment-tabpanel'
  const fragment = `#comment-${commentId}`
  return `${path}${query}${fragment}`
}

/**
 * Extracted to implement common error status handling across
 * upload/download/fetch request mechanisms.
 *
 * @param {number} statusCode an HTTP status code
 * @throws an AuthorizationError or FaqError if the status code requires
 * special handling, otherwise returns normally.
 */
function tryHandleHttpStatus (statusCode) {
  switch (statusCode) {
    case 401:
      throw new AuthorizationError('Authentication failed.')
    case 403:
      return throwPermissionsError()
    case 413:
      return throwRequestSizeError()
  }
}

function handleHttpError (e) {
  e.statusCode && tryHandleHttpStatus(e.statusCode)
  throw e
}

function throwPermissionsError () {
  throw new FaqError('You\'re not allowed to do that.', faqTopics.NO_PERMISSION)
}

function throwRequestSizeError () {
  throw new FaqError('That\'s too big.', faqTopics.FILE_TOO_LARGE)
}

async function doesItLooksLikeAPermissionProblem (response) {
  try {
    const responseText = await response.text()
    // Some Jira APIs return 400 responses for insufficient permissions (JCE-1379)
    if (response.status == 400 && responseText.toLowerCase().indexOf('permission') > -1) {
      return true
    }
  } catch (e) {
    trace(e)
  }
  return false
}

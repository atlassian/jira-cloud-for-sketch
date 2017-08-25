import fetch from 'sketch-module-fetch-polyfill'
import { assign } from 'lodash'
import { download, upload } from './request'
import { getJiraHost, getBearerToken } from './auth'
import jqlFilters from './jql-filters'
import { issueFromRest } from './entity-mappers'
import { standardIssueFields, maxMentionPickerResults } from './config'
import { trace, isTraceEnabled } from './logger'
import FaqError, {faqTopics} from './error/FaqError'
import AuthorizationError from './error/AuthorizationError'

export default class JIRA {
  constructor () {
    this.baseUrl = `https://${getJiraHost()}`
    this.apiRoot = `${this.baseUrl}/rest/api/2`
  }

  /**
   * Retrieves issues using JIRA's search API.
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
   * Retrieve a JIRA issue using the issue API.
   */
  async getIssue (issueKey, opts) {
    opts = assign({ fields: standardIssueFields }, opts)
    let issueUrl = `${this.apiRoot}/issue/${issueKey}?fields=${opts.fields.join(',')}`
    if (opts.updateHistory) {
      issueUrl += '&updateHistory=true'
    }
    return issueFromRest(await jiraFetch(issueUrl))
  }

  async getWatchers (issueKey) {
    return (await jiraFetch(`${this.apiRoot}/issue/${issueKey}/watchers`)).watchers
  }

  async getImageAsDataUri (url, mimeType) {
    const opts = {}
    // only authenticate requests to JIRA
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

  async deleteAttachment (id) {
    return jiraFetch(`${this.apiRoot}/attachment/${id}`, {method: 'DELETE'})
  }

  async addComment (issueKey, comment) {
    const commentUrl = `${this.apiRoot}/issue/${issueKey}/comment`
    const body = JSON.stringify({body: comment})
    const commentJson = await jiraFetch(commentUrl, {method: 'POST', body})
    return commentPermalink(issueKey, commentJson)
  }

  async getProfile () {
    return jiraFetch(`${this.apiRoot}/myself`)
  }

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
    switch (res.status) {
      case 400:
        if (await doesItLooksLikeAPermissionProblem(res)) {
          return throwPermissionsError()
        }
        break
      case 401:
        throw new AuthorizationError('Authentication failed.')
      case 403:
        return throwPermissionsError()
    }
    throw new Error(`JIRA responded with: ${res.status} ${res.statusText}`)
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

async function authHeader () {
  return 'Bearer ' + (await getBearerToken())
}

function commentPermalink (issueKey, commentJson) {
  const baseUrl = commentJson.self.substring(0, commentJson.self.indexOf('/rest/'))
  const commentId = commentJson.id
  const path = `${baseUrl}/browse/${issueKey}`
  const query = `?focusedCommentId=${commentId}` +
                '&page=com.atlassian.jira.plugin.system.issuetabpanels%3Acomment-tabpanel'
  const fragment = `#comment-${commentId}`
  return `${path}${query}${fragment}`
}

function handleHttpError (e) {
  if (e.statusCode == 403) {
    throwPermissionsError()
  } else {
    throw e
  }
}

function throwPermissionsError () {
  throw new FaqError('You\'re not allowed to do that.', faqTopics.NO_PERMISSION)
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

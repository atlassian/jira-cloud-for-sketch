import fetch from 'sketch-module-fetch-polyfill'
import multipart from './multipart'
import download from './download'
import { extractFilenameFromPath } from './util'
import { getJiraHost, getBearerToken } from './auth'
import JQL_FILTERS from './jql-filters'

export default class JIRA {
  constructor () {
    this.baseUrl = `https://${getJiraHost()}`
    this.apiRoot = `${this.baseUrl}/rest/api/2`
    this.jqlFilters = JQL_FILTERS
  }

  /**
   * Retrieves issues using JIRA's search API. Note that this API does not
   * populate the 'attachment' field for returned issues.
   */
  async getFilteredIssues (filterKey) {
    var filter = this.jqlFilters[filterKey]
    if (!filter) {
      throw new Error(`No filter defined for ${filterKey}`)
    }
    var jql = encodeURIComponent(filter.jql)
    const res = await fetch(`${this.apiRoot}/search?jql=${jql}`, {
      headers: {
        Accept: 'application/json',
        Authorization: await authHeader()
      }
    })
    var json = await res.json()
    return json.issues
  }

  /**
   * Retrieve a JIRA issue using the issue API. This API does populate the
   * 'attachment' field.
   */
  async getIssue (issueKey) {
    const res = await fetch(`${this.apiRoot}/issue/${issueKey}`, {
      headers: {
        Accept: 'application/json',
        Authorization: await authHeader()
      }
    })
    return res.json()
  }

  async getImageAsDataUri (url, mimeType) {
    const res = await fetch(url, {
      headers: {
        Authorization: await authHeader()
      }
    })
    var data = await res.blob()
    data = data.base64EncodedDataWithOptions(null)
    data = NSString.alloc().initWithData_encoding(data, NSUTF8StringEncoding)
    var dataUri = `data:${mimeType};base64,${data}`
    return dataUri
  }

  async downloadAttachment (url, filename) {
    const filepath = await download(url, {
      filename,
      headers: {
        Authorization: await authHeader()
      }
    })
    return filepath
  }

  async uploadAttachment (issueKey, filepath, filename) {
    filename = filename || extractFilenameFromPath(filepath)
    var uploadUrl = `${this.apiRoot}/issue/${issueKey}/attachments`
    const res = await multipart(
      uploadUrl,
      await authHeader(),
      filepath,
      filename
    )
    return res
  }

  async deleteAttachment (id) {
    var deleteUrl = `${this.apiRoot}/attachment/${id}`
    const res = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: await authHeader()
      }
    })
    return res
  }

  async addComment (issueKey, comment) {
    var commentUrl = `${this.apiRoot}/issue/${issueKey}/comment`
    var body = JSON.stringify({body: comment})
    const res = await fetch(commentUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: await authHeader()
      },
      body
    })
    return commentPermalink(issueKey, await res.json())
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

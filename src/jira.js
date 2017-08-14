import fetch from 'sketch-module-fetch-polyfill'
import { assign } from 'lodash'
import { download, upload } from './request'
import { getJiraHost, getBearerToken } from './auth'
import JQL_FILTERS from './jql-filters'
import { issueFromRest } from './entity-mappers'
import { standardIssueFields, maxMentionPickerResults } from './config'
import { trace } from './logger'

export default class JIRA {
  constructor () {
    this.baseUrl = `https://${getJiraHost()}`
    this.apiRoot = `${this.baseUrl}/rest/api/2`
    this.jqlFilters = JQL_FILTERS
  }

  /**
   * Retrieves issues using JIRA's search API.
   */
  async getFilteredIssues (filterKey, opts) {
    const filter = this.jqlFilters[filterKey]
    if (!filter) {
      throw new Error(`No filter defined for ${filterKey}`)
    }
    opts = assign({}, { fields: standardIssueFields }, opts)
    const jql = encodeURIComponent(filter.jql)
    let searchUrl = `${this.apiRoot}/search?jql=${jql}&fields=${opts.fields.join(',')}`
    if (opts.startAt) {
      searchUrl += `&startAt=${opts.startAt}`
    }
    if (opts.maxResults) {
      searchUrl += `&maxResults=${opts.maxResults}`
    }
    const res = await fetch(searchUrl, {
      headers: {
        Accept: 'application/json',
        Authorization: await authHeader()
      }
    })
    const json = await res.json()
    return json.issues.map(issueFromRest)
  }

  /**
   * Retrieve a JIRA issue using the issue API.
   */
  async getIssue (issueKey, opts) {
    opts = assign({}, { fields: standardIssueFields }, opts)
    let issueUrl = `${this.apiRoot}/issue/${issueKey}?fields=${opts.fields.join(',')}`
    if (opts.updateHistory) {
      issueUrl += '&updateHistory=true'
    }
    const res = await fetch(issueUrl, {
      headers: {
        Accept: 'application/json',
        Authorization: await authHeader()
      }
    })
    const json = await res.json()
    trace(json)
    return issueFromRest(json)
  }

  async getImageAsDataUri (url, mimeType) {
    const res = await fetch(url, {
      headers: {
        Authorization: await authHeader()
      }
    })
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
    return download(url, opts, progress)
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
    return upload(uploadUrl, opts, progress)
  }

  async deleteAttachment (id) {
    const deleteUrl = `${this.apiRoot}/attachment/${id}`
    return fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: await authHeader()
      }
    })
  }

  async addComment (issueKey, comment) {
    const commentUrl = `${this.apiRoot}/issue/${issueKey}/comment`
    const body = JSON.stringify({body: comment})
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

  async getProfile () {
    const myselfUrl = `${this.apiRoot}/myself`
    const res = await fetch(myselfUrl, {
      headers: {
        Accept: 'application/json',
        Authorization: await authHeader()
      }
    })
    return res.json()
  }

  async findUsersForPicker (query, opts) {
    opts = assign({}, {
      maxResults: maxMentionPickerResults,
      showAvatar: true
    }, opts)
    let pickerUrl = `${this.apiRoot}/user/picker?query=${query}`
    if (opts.maxResults) {
      pickerUrl += `&maxResults=${opts.maxResults}`
    }
    if (opts.showAvatar) {
      pickerUrl += '&showAvatar=true'
    }
    const res = await fetch(pickerUrl, {
      headers: {
        Accept: 'application/json',
        Authorization: await authHeader()
      }
    })
    return (await res.json()).users
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

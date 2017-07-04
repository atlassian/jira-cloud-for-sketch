import fetch from 'sketch-module-fetch-polyfill'
import multipart from './multipart'
import { extractFilenameFromPath } from './util'

export default class JIRA {
  constructor (jiraHost, bearerToken) {
    this.bearerToken = bearerToken
    this.apiRoot = 'https://' + jiraHost + '/rest/api/2'
    this.jqlFilters = {
      'recently-viewed': {
        displayName: 'Recently viewed',
        jql: 'issue in issueHistory() ' +
          'order by lastViewed'
      },
      'assigned-to-me': {
        displayName: 'Assigned to me',
        jql: 'assignee = currentUser() ' +
          'and resolution = Unresolved ' +
          'order by lastViewed'
      },
      'mentioning-me': {
        displayName: '@mentioning me',
        jql: 'text ~ currentUser() ' +
          'order by lastViewed'
      }
    }
  }

  async getFilteredIssues (filterKey) {
    var filter = this.jqlFilters[filterKey]
    if (!filter) {
      throw new Error(`No filter defined for ${filterKey}`)
    }
    var jql = encodeURIComponent(filter.jql)
    const res = await fetch(
      `${this.apiRoot}/search?jql=${jql}`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + this.bearerToken
        }
      }
    )
    return res.json()
  }

  async uploadAttachment (issueKey, filepath, filename) {
    filename = filename || extractFilenameFromPath(filepath)
    var uploadUrl = `${this.apiRoot}/issue/${issueKey}/attachments`
    const res = await multipart(
      uploadUrl,
      'Bearer ' + this.bearerToken,
      filepath,
      filename
    )
    return res
  }
}

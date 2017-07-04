import fetch from 'sketch-module-fetch-polyfill'
import multipart from './multipart'
import { extractFilenameFromPath } from './util'
import { getJiraHost, getBearerToken } from './auth'

export default class JIRA {
  constructor () {
    this.apiRoot = 'https://' + getJiraHost() + '/rest/api/2'
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
          Authorization: await authHeader()
        }
      })
    var json = await res.json()
    return json.issues
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
}

async function authHeader () {
  return 'Bearer ' + (await getBearerToken())
}

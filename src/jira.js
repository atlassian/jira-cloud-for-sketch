import fetch from 'sketch-module-fetch-polyfill'
import multipart from './multipart'
import { extractFilenameFromPath } from './util'

export default class JIRA {
  constructor (jiraHost, bearerToken) {
    this.bearerToken = bearerToken
    this.apiRoot = 'https://' + jiraHost + '/rest/api/2'
  }

  async getRecentIssues () {
    const res = await fetch(
      `${this.apiRoot}/search?jql=issue+in+issueHistory()+order+by+lastViewed`,
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

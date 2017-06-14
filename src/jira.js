import fetch from 'sketch-module-fetch-polyfill'
import { jiraSketchIntegrationApi, jiraSketchIntegrationAuthRedirectUrl } from './config'
import auth from './auth'
import multipart from './multipart'
const { format } = require('url')

export default class JIRA {

    constructor (jiraHost, bearerToken) {
        this.bearerToken = bearerToken
        this.apiRoot = 'https://' + jiraHost + '/rest/api/2'
    }

    async getRecentIssues () {
        var searchUrl = this.apiRoot + "/search?jql=issue+in+issueHistory()+order+by+lastViewed"
        const res = await fetch(searchUrl, {
            headers: {
                "Accept": "application/json",
                "Authorization": "Bearer " + this.bearerToken
            }
        })
        return res.json()
    }

    async uploadAttachment (issueKey, filepath, filename) {
        var uploadUrl = this.apiRoot + "/issue/" + issueKey + "/attachments"
        const res = await multipart(uploadUrl, "Bearer " + this.bearerToken, filepath, filename)
        return res;
    }

}

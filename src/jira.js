import fetch from 'sketch-module-fetch-polyfill'
import { jiraSketchIntegrationApi, jiraSketchIntegrationAuthRedirectUrl } from './config'
import auth from './auth'
const { format } = require('url')

export default class JIRA {

    constructor (jiraHost, bearerToken) {
        this.bearerToken = bearerToken
        this.apiRoot = 'https://' + jiraHost + '/rest/api/2'
    }

    async getRecentIssues () {
        var searchUrl = this.apiRoot + "/search?jql=issue+in+issueHistory()"
        console.log(searchUrl)
        console.log('bearer: "' + this.bearerToken + '"')
        const res = await fetch(searchUrl, {
            headers: {
                "Accept": "application/json",
                "Authorization": "Bearer " + this.bearerToken
            }
        })
        return res.json()
    }

}

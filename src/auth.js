import fetch from 'sketch-module-fetch-polyfill'
import { openInBrowser, createFailAlert } from './util'
import { jiraSketchIntegrationApi, jiraSketchIntegrationAuthRedirectUrl } from './config'
import prefs, { keys } from './prefs'
import queryString from 'query-string'
import jwt from 'atlassian-jwt'
import moment from 'moment'

export async function getSketchClientDetails () {
    if (!prefs.isSet(keys.clientId, keys.sharedSecret)) {
        // let any http errors bubble up for now
        const response = await fetch (jiraSketchIntegrationApi.client, {method: "POST"})
        const json = await response.json()
        if (!json.data.id || !json.data.sharedSecret) {
            throw new Error("Bad response from jira-sketch-integration /clients API")
        }
        prefs.setString(keys.clientId, json.data.id)
        prefs.setString(keys.sharedSecret, json.data.sharedSecret)
    }
    return {
        clientId: prefs.getString(keys.clientId),
        sharedSecret: prefs.getString(keys.sharedSecret)
    }
}

export async function authorizeSketchForJira (context, jiraUrl) {    
    const jiraHost = jiraUrl // TODO extract hostname from URL
    // for now, let's clear existing auth details if they hit the 'Connect' button in the Sketch client
    prefs.unset(keys.jiraHost, keys.clientId, keys.sharedSecret)
    const clientDetails = await getSketchClientDetails()    
    const params = {
        clientId: clientDetails.clientId,
        jiraHost: jiraHost
    }
    openInBrowser(jiraSketchIntegrationAuthRedirectUrl + "?" + queryString.stringify(params))
    
    // store the JIRA host (TODO multi-instance support)
    prefs.setString(keys.jiraHost, jiraHost)
}

export function isAuthorized () {
    return prefs.isSet(keys.jiraHost, keys.clientId, keys.sharedSecret)
}

export async function getBearerToken () {
    if (!isAuthorized()) {
        throw new Error("Please connect Sketch to JIRA before proceeding")
    }
    const now = moment().utc()
    const token = jwt.encode({
        iss: prefs.getString(keys.clientId),
        iat: now.unix(),
        exp: now.add(60, 'minutes').unix(),
        aud: [ 'jira-sketch-integration' ],
        sub: prefs.getString(keys.jiraHost)
    }, prefs.getString(keys.sharedSecret))
    const response = await fetch (jiraSketchIntegrationApi.bearer, {
        method: "POST",
        headers: {
            "Authorization": "JWT " + token
        }
    })
    const json = await response.json()
    if (!json.data.access_token) {
        throw new Error("Bad response from jira-sketch-integration /clients/bearer API")
    }
    return json.data.access_token
}

export function getJiraHost() {
    return prefs.getString(keys.jiraHost)
}

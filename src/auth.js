import fetch from 'sketch-module-fetch-polyfill'
import { openInBrowser, createFailAlert } from './util'
import { pluginName, jiraSketchIntegrationApi, jiraSketchIntegrationAuthRedirectUrl } from './config'
import queryString from 'query-string'
import prefsManager from 'sketch-module-user-preferences'
import jwt from 'atlassian-jwt'
import moment from 'moment'

const _NOT_SET = "__NOT_SET"

function getUserPrefs() {
    return prefsManager.getUserPreferences(pluginName, {
        clientId: _NOT_SET,
        sharedSecret: _NOT_SET,
        jiraHost: _NOT_SET
    })
}

function setUserPrefs(prefs) {
    prefsManager.setUserPreferences(pluginName, prefs)
}

export async function getSketchClientDetails () {
    const prefs = getUserPrefs()
    const hasStoredDetails = prefs && isPreferencesSet(prefs, "clientId", "sharedSecret")
    if (!hasStoredDetails) {
        // let any http errors bubble up for now
        const response = await fetch (jiraSketchIntegrationApi.client, {method: "POST"})
        const json = await response.json()
        if (!json.data.id || !json.data.sharedSecret) {
            throw new Error("Bad response from jira-sketch-integration /clients API")
        }
        prefs.clientId = json.data.id
        prefs.sharedSecret = json.data.sharedSecret
        setUserPrefs(prefs)
    }
    return {
        clientId: prefs.clientId,
        sharedSecret: prefs.sharedSecret
    }
}

function isPreferencesSet(prefs, name) {
    for (var i = 1; i < arguments.length; i++) {
        var value = prefs[name]
        if (!value || value === _NOT_SET || value === "null") {
            return false
        }
    }
    return true
}

export async function authorizeSketchForJira (context, jiraUrl) {    
    const jiraHost = jiraUrl // TODO extract hostname from URL
    const clientDetails = await getSketchClientDetails()    
    const params = {
        clientId: clientDetails.clientId,
        jiraHost: jiraHost
    }
    openInBrowser(jiraSketchIntegrationAuthRedirectUrl + "?" + queryString.stringify(params))
    
    // store the JIRA host (TODO multi-instance support)
    const prefs = getUserPrefs()
    prefs.jiraHost = jiraHost
    setUserPrefs(prefs)
}

export async function getBearerToken () {
    const prefs = getUserPrefs()
    if (!isPreferencesSet(prefs, "jiraHost" , "clientId", "sharedSecret")) {
        throw new Error("Please connect Sketch to JIRA before proceeding")
    }
    const now = moment().utc()
    const token = jwt.encode({
        iss: prefs.clientId,
        iat: now.unix(),
        exp: now.add(60, 'minutes').unix(),
        aud: [ 'jira-sketch-integration' ],
        sub: prefs.jiraHost
    }, prefs.sharedSecret)
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

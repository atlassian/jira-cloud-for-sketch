import fetch from 'sketch-module-fetch-polyfill'
import { openInBrowser, createFailAlert } from './util';
import { pluginName, jiraSketchIntegrationApi, jiraSketchIntegrationAuthRedirectUrl } from './config';
import queryString from 'query-string';
import prefsManager from 'sketch-module-user-preferences'

const _NOT_SET = "__NOT_SET"

export async function getSketchClientDetails () {
    const prefs = prefsManager.getUserPreferences(pluginName, {
        clientId: _NOT_SET,
        sharedSecret: _NOT_SET
    })
    if (!prefs.clientId || prefs.clientId === _NOT_SET || !prefs.sharedSecret || prefs.sharedSecret === _NOT_SET) {
        // let any http errors bubble up for now
        const response = await fetch (jiraSketchIntegrationApi.client, {method: "POST"})
        const json = await response.json()
        prefs.clientId = json.data.id
        prefs.sharedSecret = json.data.sharedSecret
        prefsManager.setUserPreferences(pluginName, prefs)
    }
    return {
        clientId: prefs.clientId,
        sharedSecret: prefs.sharedSecret
    }
}

export async function authorizeSketchForJira (context, jiraUrl) {
    const jiraHost = jiraUrl; // TODO extract hostname from URL
    const clientDetails = await getSketchClientDetails()
    const params = {
        clientId: clientDetails.clientId,
        jiraHost: jiraHost
    }
    openInBrowser(jiraSketchIntegrationAuthRedirectUrl + "?" + queryString.stringify(params))
}

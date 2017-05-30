import fetch from 'sketch-module-fetch-polyfill'
import { openInBrowser, createFailAlert } from './util';
import { pluginName, jiraSketchIntegrationApi } from './config';
import queryString from 'query-string';
import prefsManager from 'sketch-module-user-preferences'

const _NOT_SET = "__NOT_SET"

export async function getSketchClientDetails () {
    const prefs = prefsManager.getUserPreferences(pluginName, {
        clientId: _NOT_SET,
        sharedSecret: _NOT_SET
    })
    if (prefs.clientId === _NOT_SET || prefs.sharedSecret === _NOT_SET) {
        // let any http errors bubble up for now
        var response = await fetch (jiraSketchIntegrationApi.client, {method: "POST"})
        var json = await response.json()
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
    var clientDetails = await getSketchClientDetails()
    var params = {
        clientId: clientDetails.clientId,
        jiraUrl: jiraUrl
    }
    openInBrowser(jiraSketchIntegrationApi.authorizeJira + "?" + queryString.stringify(params))
}

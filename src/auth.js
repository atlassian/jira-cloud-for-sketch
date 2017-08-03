import fetch from 'sketch-module-fetch-polyfill'
import {
  jiraSketchIntegrationBaseUrl,
  jiraSketchIntegrationApi,
  jiraSketchIntegrationApiAuth,
  authorizationPollInterval
} from './config'
import { isSet, setString, getString, unset, keys } from './prefs'
import queryString from 'query-string'
import jwt from 'atlassian-jwt'
import moment from 'moment'
import URL from 'url-parse'
import { trace } from './logger'
import analytics from './analytics'
import TokenCache from './token-cache'

const tokenCache = new TokenCache(_getBearerToken)

/**
 * We store the addon base URL in order to detect if the user switches addons
 * (e.g. to staging or dogfooding)
 */
function isAddonUrlChanged () {
  return !isSet(keys.addonUrl) || getString(keys.addonUrl) != jiraSketchIntegrationBaseUrl
}

export async function getSketchClientDetails () {
  if (!isSet(keys.clientId, keys.sharedSecret) || isAddonUrlChanged()) {
    // let any http errors bubble up for now
    const response = await fetch(jiraSketchIntegrationApi.client, {
      method: 'POST'
    })
    const json = await response.json()
    if (!json.data.id || !json.data.sharedSecret) {
      throw new Error('Bad response from jira-sketch-integration /clients API')
    }
    setString(keys.clientId, json.data.id)
    setString(keys.sharedSecret, json.data.sharedSecret)
    setString(keys.addonUrl, jiraSketchIntegrationBaseUrl)
    analytics.clientIdRetrieved()
  }
  return {
    clientId: getString(keys.clientId),
    sharedSecret: getString(keys.sharedSecret)
  }
}

export function setJiraUrl (jiraUrl) {
  const jiraHost = parseHostname(jiraUrl)
  unset(keys.jiraHost, keys.authorized)
  tokenCache.flush()
  setString(keys.jiraHost, jiraHost)
}

export async function getAuthorizationUrl () {
  const jiraHost = getString(keys.jiraHost)
  const clientDetails = await getSketchClientDetails()
  const params = {
    clientId: clientDetails.clientId,
    jiraHost: jiraHost
  }
  return `${jiraSketchIntegrationBaseUrl}/auth/jira?${queryString.stringify(params)}`
  // const authApiUrl = `${jiraSketchIntegrationApi}?${queryString.stringify(params)}`
  // const response = await fetch(authApiUrl, {
  //   headers: {
  //     Authorization: jwtAuthHeader()
  //   }
  // })
  // const json = await response.json()
  // trace(json)
  // if (!json.authorizeUrl) throw new Error('Response from authorize API did not contain `authorizeUrl`')
  // return json.authorizeUrl
}

export async function awaitAuthorization () {
  return new Promise((resolve, reject) => {
    const poller = setInterval(async () => {
      if (await testAuthorization()) {
        clearInterval(poller)
        resolve()
      } else {
        trace(`Not yet authorized, retrying in ${authorizationPollInterval}`)
      }
    }, authorizationPollInterval)
  })
}

export async function testAuthorization () {
  try {
    await _getBearerToken()
    setString(keys.authorized, 'true')
    return true
  } catch (e) {
    trace(`Test authorization failed: ${JSON.stringify(e)}`)
    return false
  }
}

export function isAuthorized () {
  return isSet(
    keys.jiraHost,
    keys.clientId,
    keys.sharedSecret,
    keys.authorized
  ) && !isAddonUrlChanged()
}

export async function getBearerToken (force) {
  checkAuthorized()
  return tokenCache.get(force)
}

async function _getBearerToken () {
  const response = await fetch(jiraSketchIntegrationApi.bearer, {
    method: 'POST',
    headers: {
      Authorization: jwtAuthHeader()
    }
  })
  const json = await response.json()
  if (!json.data.access_token) {
    throw new Error(
      'Bad response from jira-sketch-integration /clients/bearer API'
    )
  }
  return [json.data.access_token, json.data.expires_in]
}

export function getClientId () {
  return getString(keys.clientId)
}

export function getJiraHost () {
  return getString(keys.jiraHost)
}

function checkAuthorized () {
  if (!isAuthorized()) {
    throw new Error('Please connect Sketch to JIRA before proceeding')
  }
}

function jwtAuthHeader () {
  const now = moment().utc()
  const token = jwt.encode(
    {
      iss: getClientId(),
      iat: now.unix(),
      exp: now.add(60, 'minutes').unix(),
      aud: ['jira-sketch-integration'],
      sub: getJiraHost()
    },
    getString(keys.sharedSecret)
  )
  return `JWT ${token}`
}

function parseHostname (partialUrl) {
  if (!partialUrl) {
    throw new Error('Blank url')
  }
  if (partialUrl.indexOf('://') == -1) {
    partialUrl = 'https://' + partialUrl
  }
  return new URL(partialUrl).hostname
}

import fetch from 'sketch-module-fetch-polyfill'
import {
  jiraSketchIntegrationBaseUrl,
  jiraSketchIntegrationApi,
  userAuthorizationPollInterval,
  jiraAuthorizationUrlMaxRetries,
  jiraAuthorizationUrlRetryInterval
} from './config'
import { isSet, setString, getString, unset, keys } from './prefs'
import queryString from 'query-string'
import jwt from 'atlassian-jwt'
import moment from 'moment'
import URL from 'url-parse'
import { trace, isTraceEnabled } from './logger'
import analytics from './analytics'
import TokenCache from './token-cache'
import { retryUntilReturn, retryUntilTruthy } from './util'
import AuthorizationError from './AuthorizationError'

const tokenCache = new TokenCache(_getBearerToken)

/**
 * We store the addon base URL in order to detect if the user switches addons
 * (e.g. to staging or dogfooding)
 */
function isAddonUrlChanged () {
  if (!isSet(keys.addonUrl)) {
    trace('Addon URL not set!')
    return true
  } else if (getString(keys.addonUrl) != jiraSketchIntegrationBaseUrl) {
    if (isTraceEnabled()) {
      trace(`Addon URL switched from ${getString(keys.addonUrl)} to ${jiraSketchIntegrationBaseUrl}`)
    }
    return true
  }
  return false
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

/**
 * The first time the authorization URL is retrieved for a particular JIRA
 * instance, the supporting Atlassian Cloud add-on will be automatically
 * installed. This can take some time, so this function will re-request the
 * authorization URL multiple times in case of error or timeout.
 */
export async function getAuthorizationUrl () {
  const jiraHost = getString(keys.jiraHost)
  const clientDetails = await getSketchClientDetails()
  return retryUntilReturn(
    () => { return _getAuthorizationUrl(clientDetails.clientId, jiraHost) },
    jiraAuthorizationUrlMaxRetries,
    jiraAuthorizationUrlRetryInterval
  )
}

async function _getAuthorizationUrl (clientId, jiraHost) {
  const qs = queryString.stringify({clientId, jiraHost})
  const authApiUrl = `${jiraSketchIntegrationApi.authorize}?${qs}`
  const response = await fetch(authApiUrl, {
    headers: {
      Authorization: await jwtAuthHeader()
    }
  })
  const json = await response.json()
  trace(json)
  if (!json.authorizeUrl) throw new Error('Response from authorize API did not contain `authorizeUrl`')
  return json.authorizeUrl
}

export async function awaitAuthorization () {
  return retryUntilTruthy(testAuthorization, 0, userAuthorizationPollInterval)
}

export async function testAuthorization () {
  try {
    await tokenCache.get(true)
    setString(keys.authorized, 'true')
    return true
  } catch (e) {
    trace(`Test authorization failed: ${JSON.stringify(e)}`)
    return false
  }
}

export function isAuthorized () {
  const authorized = isSet(
    keys.jiraHost,
    keys.clientId,
    keys.sharedSecret,
    keys.authorized
  ) && !isAddonUrlChanged()
  if (!authorized) {
    unset(keys.authorized)
  }
  return authorized
}

export async function getBearerToken (force) {
  checkAuthorized()
  return tokenCache.get(force)
}

async function _getBearerToken () {
  const response = await fetch(jiraSketchIntegrationApi.bearer, {
    method: 'POST',
    headers: {
      Authorization: await jwtAuthHeader()
    }
  })
  const json = await response.json()
  trace(json)
  if (json.error) {
    const error = json.error
    switch (error.code) {
      case 'WRONG_ID':
      case 'NOT_AUTHORIZED':
        unset(keys.authorized)
        throw new AuthorizationError('JIRA requires the Sketch plugin to be reauthorized')
      default:
        throw new Error(error.message)
    }
  }
  if (!json.data || !json.data.access_token) {
    throw new Error(
      'Bad response from jira-sketch-integration /clients/bearer API'
    )
  }
  return [json.data.access_token, json.data.expires_in]
}

export function isJiraHostSet () {
  return isSet(keys.jiraHost)
}

export function getJiraHost () {
  return getString(keys.jiraHost)
}

function checkAuthorized () {
  if (!isAuthorized()) {
    throw new Error('Please connect Sketch to JIRA before proceeding')
  }
}

async function jwtAuthHeader () {
  const clientDetails = await getSketchClientDetails()
  const now = moment().utc()
  const token = jwt.encode(
    {
      iss: clientDetails.clientId,
      iat: now.unix(),
      exp: now.add(60, 'minutes').unix(),
      aud: ['jira-sketch-integration'],
      sub: getJiraHost()
    },
    clientDetails.sharedSecret
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

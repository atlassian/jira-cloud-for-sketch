/*
 * The plugin authenticates with JIRA using an OAuth2 bearer token (see
 * https://developer.atlassian.com/cloud/jira/platform/oauth-2-jwt-bearer-token-authorization-grant-type/).
 * These bearer tokens are provided by a system Atlassian Connect add-on
 * installed in JIRA (jira-sketch-integration) which maps a Sketch plugin
 * instance to a JIRA Cloud user via an 'OAuth2-like' authorization dance
 * by the plugin's 'Connect' panel.
 *
 * This file contains various functions for authorizing users and retrieving
 * bearer tokens.
 */
import fetch from 'sketch-module-fetch-polyfill'
import {
  jiraSketchIntegrationBaseUrl,
  jiraSketchIntegrationApi,
  jiraAuthorizationUrlMaxRetries,
  jiraAuthorizationUrlRetryInterval
} from './config'
import { isSet, setString, getString, unset, keys } from './prefs'
import queryString from 'query-string'
import jwt from 'atlassian-jwt'
import moment from 'moment'
import URL from 'url-parse'
import { trace, isTraceEnabled } from './logger'
import { analytics } from './analytics'
import TokenCache from './token-cache'
import { retryUntilReturn } from './util'
import AuthorizationError from './error/AuthorizationError'
import FaqError, { faqTopics } from './error/FaqError'

const tokenCache = new TokenCache(_getBearerToken)

/**
 * We store the addon base URL in order to detect if the user switches addons
 * (e.g. to staging or dogfooding)
 *
 * @return {boolean} whether the configured addon base URL has changed
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

/**
 * @typedef {Object} ClientCredentials
 * @property {string} clientId the client ID provided by the JIRA-Sketch
 * integration add-on
 * @property {number} sharedSecret the shared secret associated with the client
 * ID, used to authenticate with the JIRA-Sketch integration add-on
 */

/**
 * Create or retrieve stored credentials that the plugin uses to authenticate
 * with the JIRA-Sketch integration add-on
 *
 * @return {Promise<ClientCredentials>} the stored (or newly created) client credentials
 */
export async function getSketchClientDetails () {
  if (!isSet(keys.clientId, keys.sharedSecret) || isAddonUrlChanged()) {
    // let any http errors bubble up
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
    analytics('clientIdRetrieved', {addonUrl: jiraSketchIntegrationBaseUrl})
  }
  return {
    clientId: getString(keys.clientId),
    sharedSecret: getString(keys.sharedSecret)
  }
}

/**
 * @param {string} jiraUrl the hostName of the JIRA Cloud instance the plugin
 * is currently connected to.
 */
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
 *
 * @return {Promise<String>} the URL of a page where the user can authorize
 * Sketch to connect to JIRA on their behalf
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

/**
 * A helper function for `getAuthorizationUrl`
 *
 * @param {string} clientId the plugin's clientId, see `getSketchClientDetails`
 * @param {string} jiraHost the JIRA Cloud site's hostname
 */
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
  if (!json.authorizeUrl) {
    throw new FaqError(`Couldn't connect to ${jiraHost}`, faqTopics.CAN_NOT_CONNECT)
  }
  return json.authorizeUrl
}

/**
 * Test whether the user has authorized the plugin to connect to JIRA on their
 * behalf by requesting an authorization token.
 *
 * @return {Promise<boolean>} true if the use is authorized, false otherwise
 */
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

/**
 * @return {boolean} true if the client details are set correctly, the user has
 * previously successfully retrieved a bearer token, and the addon url has not
 * changed. Otherwise, return false.
 */
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

/**
 * @param {boolean} force skip & flush the cache
 * @return {Promise<string>} an OAuth2 bearer token for authenticating with JIRA
 */
export async function getBearerToken (force) {
  checkAuthorized()
  return tokenCache.get(force)
}

/**
 * Retrieve an OAuth2 bearer token from the JIRA-Sketch integration add-on.
 * @throws if there was an issue retrieving the OAuth2 token
 */
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

/**
 * @return {boolean} whether the JIRA host name is set
 */
export function isJiraHostSet () {
  return isSet(keys.jiraHost)
}

/**
 * @return {string} the JIRA host name
 * @throws if the JIRA host name is not set
 */
export function getJiraHost () {
  return getString(keys.jiraHost)
}

/**
 * @throws if the user is not currently authorized (see `isAuthorized`)
 */
function checkAuthorized () {
  if (!isAuthorized()) {
    throw new Error('Please connect Sketch to JIRA before proceeding')
  }
}

/**
 * @return {Promise<string>} a JWT auth header for authenticating with the
 * JIRA-Sketch integration add-on
 */
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

/**
 * @param {string} partialUrl a URL or part thereof
 * @return {string} the hostname from the provided URL
 */
function parseHostname (partialUrl) {
  if (!partialUrl) {
    throw new Error('Blank url')
  }
  if (partialUrl.indexOf('://') == -1) {
    partialUrl = 'https://' + partialUrl
  }
  return new URL(partialUrl).hostname
}

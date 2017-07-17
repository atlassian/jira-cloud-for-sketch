import fetch from 'sketch-module-fetch-polyfill'
import { openInBrowser } from './util'
import {
  jiraSketchIntegrationApi,
  jiraSketchIntegrationAuthRedirectUrl
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

export async function getSketchClientDetails () {
  if (!isSet(keys.clientId, keys.sharedSecret)) {
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
    analytics.clientIdRetrieved()
  }
  return {
    clientId: getString(keys.clientId),
    sharedSecret: getString(keys.sharedSecret)
  }
}

export async function authorizeSketchForJira (context, jiraUrl) {
  const jiraHost = parseHostname(jiraUrl)
  // for now, let's clear existing host if they hit the 'Connect' button in the Sketch client
  unset(keys.jiraHost)
  tokenCache.flush()
  const clientDetails = await getSketchClientDetails()
  const params = {
    clientId: clientDetails.clientId,
    jiraHost: jiraHost
  }
  openInBrowser(
    `${jiraSketchIntegrationAuthRedirectUrl}?${queryString.stringify(params)}`
  )
  // store the JIRA host (TODO multi-instance support)
  setString(keys.jiraHost, jiraHost)
}

export function isAuthorized () {
  return isSet(keys.jiraHost, keys.clientId, keys.sharedSecret)
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

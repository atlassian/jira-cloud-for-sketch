import fetch from 'sketch-module-fetch-polyfill'
import { openInBrowser } from './util'
import {
  jiraSketchIntegrationApi,
  jiraSketchIntegrationAuthRedirectUrl,
  bearerTokenExpirySafetyMargin
} from './config'
import prefs, { keys } from './prefs'
import queryString from 'query-string'
import jwt from 'atlassian-jwt'
import moment from 'moment'
import URL from 'url-parse'
import { trace } from './logger'

var cachedBearerToken = null
var cachedBearerTokenExpiry = null

export async function getSketchClientDetails () {
  if (!prefs.isSet(keys.clientId, keys.sharedSecret)) {
    // let any http errors bubble up for now
    const response = await fetch(jiraSketchIntegrationApi.client, {
      method: 'POST'
    })
    const json = await response.json()
    if (!json.data.id || !json.data.sharedSecret) {
      throw new Error('Bad response from jira-sketch-integration /clients API')
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
  const jiraHost = parseHostname(jiraUrl)
  // for now, let's clear existing auth details if they hit the 'Connect' button in the Sketch client
  prefs.unset(keys.jiraHost, keys.clientId, keys.sharedSecret)
  cachedBearerToken = cachedBearerTokenExpiry = null
  const clientDetails = await getSketchClientDetails()
  const params = {
    clientId: clientDetails.clientId,
    jiraHost: jiraHost
  }
  openInBrowser(
    `${jiraSketchIntegrationAuthRedirectUrl}?${queryString.stringify(params)}`
  )
  // store the JIRA host (TODO multi-instance support)
  prefs.setString(keys.jiraHost, jiraHost)
}

export function isAuthorized () {
  return prefs.isSet(keys.jiraHost, keys.clientId, keys.sharedSecret)
}

export async function getBearerToken () {
  checkAuthorized()
  const now = moment.utc()
  if ((!cachedBearerToken) || cachedBearerTokenExpiry < now.unix()) {
    var token = await _getBearerToken()
    cachedBearerTokenExpiry = now.unix() + token.expires_in - bearerTokenExpirySafetyMargin
    cachedBearerToken = token.access_token
  }
  return cachedBearerToken
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
  // trace(JSON.stringify(json.data))
  return json.data
}

export function getJiraHost () {
  return prefs.getString(keys.jiraHost)
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
      iss: prefs.getString(keys.clientId),
      iat: now.unix(),
      exp: now.add(60, 'minutes').unix(),
      aud: ['jira-sketch-integration'],
      sub: prefs.getString(keys.jiraHost)
    },
    prefs.getString(keys.sharedSecret)
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

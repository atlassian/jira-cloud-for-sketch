import { assign, isNumber } from 'lodash'
import { resourcesPath, scriptsPath, readFileAsJson } from './util'

const defaults = {
  logLevel: 10,
  jiraSketchIntegrationBaseUrl: 'https://sketch.prod.atl-paas.net',
  analyticsApiBaseUrl: 'https://mgas.prod.public.atl-paas.net/v1',
  bearerTokenExpirySafetyMargin: 60, // seconds
  bearerTokenRefreshInterval: 1000 * 60 * 10, // milliseconds
  thumbnailDownloadConcurrency: 4,
  attachmentUploadConcurrency: 4,
  thumbnailRetryMax: 10,
  thumbnailRetryDelay: 1500, // milliseconds
  cocoaDelegatePollInterval: 200 // milliseconds
}

const config = assign({}, defaults,
  readFileAsJson(`${resourcesPath()}/config.json`)
)

const manifest = readFileAsJson(`${scriptsPath()}/manifest.json`)

export const logLevels = {
  TRACE: 10,
  DEBUG: 20,
  INFO: 30,
  WARN: 40,
  ERROR: 50
}

export const logLevel = parseLogLevel(config.logLevel)

export const pluginName = 'jira-sketch-plugin'
export const tempDirName = pluginName

export const pluginVersion = manifest.version

export const jiraSketchIntegrationBaseUrl = config.jiraSketchIntegrationBaseUrl

export const jiraSketchIntegrationAuthRedirectUrl =
  jiraSketchIntegrationBaseUrl + '/auth/jira'

export const jiraSketchIntegrationApiBaseUrl =
  jiraSketchIntegrationBaseUrl + '/api'

export const standardIssueFields = ['issuetype', 'summary', 'attachment']

export const jiraSketchIntegrationApi = {
  client: jiraSketchIntegrationApiBaseUrl + '/clients',
  bearer: jiraSketchIntegrationApiBaseUrl + '/clients/bearer'
}

export const analyticsApiBaseUrl = config.analyticsApiBaseUrl
export const analyticsApiSingleEvent = analyticsApiBaseUrl + '/event'
export const analyticsApiMultipleEvents = analyticsApiBaseUrl + '/events'
export const analyticsIdKey = 'atlassian.analytics.id'

export const bearerTokenExpirySafetyMargin = config.bearerTokenExpirySafetyMargin
export const bearerTokenRefreshInterval = config.bearerTokenRefreshInterval

export const thumbnailDownloadConcurrency = config.thumbnailDownloadConcurrency
export const attachmentUploadConcurrency = config.attachmentUploadConcurrency

export const thumbnailRetryMax = config.thumbnailRetryMax
export const thumbnailRetryDelay = config.thumbnailRetryDelay

export const feedbackUrl = 'https://goo.gl/forms/OrIB4RoEePhL3lkv2'

export const cocoaDelegatePollInterval = config.cocoaDelegatePollInterval

export const jiraDateMomentFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZZ'

function parseLogLevel (level) {
  if (isNumber(level)) {
    return level
  }
  const levelName = level.trim().toUpperCase()
  if (logLevels[levelName]) {
    return logLevels[levelName]
  }
  const levelValue = parseInt(level)
  if (levelValue) {
    return levelValue
  }
  console.log(`Couldn't parse log level: '${level}'`)
  return defaults.logLevel
}

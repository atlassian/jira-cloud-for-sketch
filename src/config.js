export const OFFLINE_DEV = false

export const logLevels = {
  TRACE: 10,
  DEBUG: 20,
  INFO: 30,
  WARN: 40,
  ERROR: 50
}
export const logLevel = logLevels.TRACE

export const pluginName = 'jira-sketch-plugin'
export const tempDirName = pluginName

export const pluginVersion = '0.0.6'

export const jiraSketchIntegrationBaseUrl =
  'https://sketch.prod.atl-paas.net'

export const jiraSketchIntegrationAuthRedirectUrl =
  jiraSketchIntegrationBaseUrl + '/auth/jira'

export const jiraSketchIntegrationApiBaseUrl =
  jiraSketchIntegrationBaseUrl + '/api'

export const standardIssueFields = ['issuetype', 'summary', 'attachment']

export const jiraSketchIntegrationApi = {
  client: jiraSketchIntegrationApiBaseUrl + '/clients',
  bearer: jiraSketchIntegrationApiBaseUrl + '/clients/bearer'
}

export const analyticsApiBaseUrl = 'https://mgas.prod.public.atl-paas.net/v1'
export const analyticsApiSingleEvent = analyticsApiBaseUrl + '/event'
export const analyticsApiMultipleEvents = analyticsApiBaseUrl + '/events'
export const analyticsIdKey = 'atlassian.analytics.id'

export const bearerTokenExpirySafetyMargin = 60 // seconds
export const bearerTokenRefreshInterval = 1000 * 60 * 10 // milliseconds

export const thumbnailDownloadConcurrency = 4
export const attachmentUploadConcurrency = 4

export const feedbackUrl = 'https://goo.gl/forms/OrIB4RoEePhL3lkv2'

export const cocoaDelegatePollInterval = 200

export const jiraDateMomentFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZZ'

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

export const jiraSketchIntegrationBaseUrl =
  'https://jira-sketch-integration.ap-southeast-2.dev.public.atl-paas.net'

export const jiraSketchIntegrationAuthRedirectUrl =
  jiraSketchIntegrationBaseUrl + '/auth/jira'

export const jiraSketchIntegrationApiBaseUrl =
  jiraSketchIntegrationBaseUrl + '/api'

export const jiraSketchIntegrationApi = {
  client: jiraSketchIntegrationApiBaseUrl + '/clients',
  bearer: jiraSketchIntegrationApiBaseUrl + '/clients/bearer'
}

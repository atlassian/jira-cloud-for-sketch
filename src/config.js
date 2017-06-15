export const pluginName = "jira-sketch-plugin"

export const jiraSketchIntegrationBaseUrl = "https://jira-sketch-integration.ap-southeast-2.dev.public.atl-paas.net"

export const jiraSketchIntegrationAuthRedirectUrl = jiraSketchIntegrationBaseUrl + "/auth/jira"

export const jiraSketchIntegrationApiBaseUrl = jiraSketchIntegrationBaseUrl + "/api"
export const jiraSketchIntegrationApi = {
    client: jiraSketchIntegrationApiBaseUrl + "/clients",
    bearer: jiraSketchIntegrationApiBaseUrl + "/clients/bearer"
}

export const pluginName = "jira-sketch-plugin"

export const jiraSketchIntegrationBaseUrl = "https://timboconnect.ngrok.io"
export const jiraSketchIntegrationApiBaseUrl = jiraSketchIntegrationBaseUrl + "/api"
export const jiraSketchIntegrationApi = {
    authorizeJira: jiraSketchIntegrationApiBaseUrl + "/authorize-jira",
    client: jiraSketchIntegrationApiBaseUrl + "/clients",
}

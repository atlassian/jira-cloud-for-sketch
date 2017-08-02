import pluginCall from 'sketch-module-web-view/client'

export async function analytics (event, properties) {
  pluginCall('analytics', event, properties)
}

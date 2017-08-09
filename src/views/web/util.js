import pluginCall from 'sketch-module-web-view/client'

export async function analytics (event, properties) {
  pluginCall('analytics', event, properties)
}

export function truncateWithEllipsis (string, maxLength) {
  if (string && string.length > maxLength) {
    return string.substring(0, maxLength - 3) + '...'
  } else {
    return string
  }
}

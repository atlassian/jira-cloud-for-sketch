/*
 * Client-side (JavaScript) utility functions.
 */

import pluginCall from 'sketch-module-web-view/client'

/**
 * Send an analytics event.
 *
 * @param {string} event the event name
 * @param {Object} properties additional properties to send with the event (see
 * https://extranet.atlassian.com/display/MOD/Public+Analytics+aka+GAS for
 * restrictions regarding these properties)
 */
export async function analytics (event, properties) {
  pluginCall('analytics', event, properties)
}

/**
 * @param {string} string a string to potentially truncate
 * @param {number} maxLength the maximum length of the string after truncation
 * @return {string} the string, truncated if its length exceeds maxLength
 */
export function truncateWithEllipsis (string, maxLength) {
  if (string && string.length > maxLength) {
    return string.substring(0, maxLength - 3) + '...'
  } else {
    return string
  }
}

/**
 * @param {number} delay duration in milliseconds
 * @return {Promise} a Promise that resolves after the specified delay
 */
export function sleep (delay) {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay)
  })
}

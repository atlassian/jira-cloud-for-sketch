import fetch from 'sketch-polyfill-fetch-babel-safe'
import moment from 'moment'
import {
  pluginVersion,
  analyticsApiSingleEvent,
  analyticsApiMultipleEvents,
  analyticsIdKey
} from './config'
import { isAuthorized, getJiraHost } from './auth'
import { trace, isTraceEnabled, warn } from './logger'

var analyticsId = NSUserDefaults.standardUserDefaults().objectForKey(analyticsIdKey)
// an early bug meant we serialized the string 'null' and stored it
if (!analyticsId || analyticsId == 'null') {
  analyticsId = NSUUID.UUID().UUIDString() + ''
  NSUserDefaults.standardUserDefaults().setObject_forKey(
    analyticsId,
    analyticsIdKey
  )
}
// convert to js string
analyticsId = analyticsId + ''

/**
 * Create an analytics event payload.
 *
 * @param {string} event the event name
 * @param {Object} properties additional properties to send with the event (see
 * https://extranet.atlassian.com/display/MOD/Public+Analytics+aka+GAS for
 * restrictions regarding these properties). Do NOT send user content or
 * personally identifying information in events.
 */
function event (eventName, properties) {
  // https://extranet.atlassian.com/display/MOD/Public+Analytics+aka+GAS
  const payload = {
    name: eventName,
    server: isAuthorized() ? getJiraHost() : '-',
    product: 'atlassian-sketch-plugin',
    subproduct: 'jira',
    version: pluginVersion,
    user: analyticsId,
    serverTime: moment.now()
  }
  if (properties) {
    payload.properties = properties
  }
  return payload
}

/**
 * Send a single analytics event.
 */
export async function analytics (eventName, properties) {
  return postToAnalyticsApi(
    analyticsApiSingleEvent,
    event(eventName, properties)
  )
}

/**
 * Send an array of analytics events.
 */
export async function analyticsBatch (events) {
  return postToAnalyticsApi(analyticsApiMultipleEvents, {
    events: events.map(({name, properties}) => event(name, properties))
  })
}

async function postToAnalyticsApi (api, payload) {
  const body = JSON.stringify(payload)
  trace(`analytics event(s) ${body}`)
  try {
    const res = await fetch(api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body
    })
    if (isTraceEnabled()) {
      trace(`analytics posted (${res.status})`)
      trace(await res.text())
    }
  } catch (e) {
    warn(`Failed to send analytics event(s) ${e}`)
  }
}

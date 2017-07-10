import fetch from 'sketch-module-fetch-polyfill'
import moment from 'moment'
import { OFFLINE_DEV, pluginVersion, analyticsApi, analyticsIdKey } from './config'
import { isAuthorized, getJiraHost } from './auth'
import { trace, warn } from './logger'

var analyticsId = NSUserDefaults.standardUserDefaults().objectForKey(
  analyticsIdKey
) + ''
if (!analyticsId) {
  analyticsId = NSUUID.UUID().UUIDString() + ''
  NSUserDefaults.standardUserDefaults().setObject_forKey(
    analyticsId,
    analyticsIdKey
  )
}

export default async function (context, eventName) {
  // https://extranet.atlassian.com/display/MOD/Public+Analytics+aka+GAS
  var payload = {
    name: eventName,
    server: (!OFFLINE_DEV && isAuthorized()) ? getJiraHost() : '-',
    product: 'atlassian-sketch-plugin',
    subproduct: 'jira',
    version: pluginVersion,
    user: analyticsId,
    serverTime: moment.now()
  }
  var body = JSON.stringify(payload)
  trace(`analytics event ${body}`)
  if (!OFFLINE_DEV) {
    try {
      const res = await fetch(analyticsApi, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: body
      })
      trace(`analytics posted (${res.status})`)
    } catch (e) {
      warn(`Failed to send analytics event ${e}`)
    }
  }
}

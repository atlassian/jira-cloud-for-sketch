import fetch from 'sketch-module-fetch-polyfill'
import moment from 'moment'
import {
  OFFLINE_DEV,
  pluginVersion,
  analyticsApiSingleEvent,
  analyticsApiMultipleEvents,
  analyticsIdKey
} from './config'
import { isAuthorized, getJiraHost } from './auth'
import { trace, isTraceEnabled, warn } from './logger'

const eventNames = [
  'clientIdRetrieved',
  'bearerTokenCacheMiss',
  'bearerTokenCacheHit',
  'bearerTokenCacheFlush',
  'bearerTokenForceRefresh',
  'jiraConnectPanelOpen',
  'jiraConnectInitiateDance',
  'jiraDisconnect', // not implemented yet
  'viewIssueListPanelOpen',
  'viewIssueListPanelOpenNotConnected',
  'viewIssueListDefaultFilter', // suffixed with keys from ./jql-filters
  'viewIssueListFilterChangeTo', // suffixed with keys from ./jql-filters
  'viewIssueListFilterLoaded', // suffixed with keys from ./jql-filters
  'viewIssue',
  'viewIssue10Seconds', // not implemented yet
  'backToViewIssueList',
  'viewIssueProfileLoaded',
  'viewIssueAttachmentsLoaded',
  'viewIssueAttachmentLoaded',
  'viewIssueSingleAttachmentUpload',
  'viewIssueMultipleAttachmentUpload',
  'viewIssueAttachmentUpload',
  'viewIssueAttachmentReplace',
  'viewIssueAttachmentDelete',
  'viewIssueAttachmentOpen',
  'viewIssueOpenInBrowser',
  'viewIssueCommentAdd',
  'feedbackOpenInBrowser'
]

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

export function event (eventName, properties) {
  // https://extranet.atlassian.com/display/MOD/Public+Analytics+aka+GAS
  const payload = {
    name: eventName,
    server: (!OFFLINE_DEV && isAuthorized()) ? getJiraHost() : '-',
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

export async function postSingle (eventName, properties) {
  return _postToAnalyticsApi(analyticsApiSingleEvent, event(eventName, properties))
}

export async function postMultiple (events) {
  return _postToAnalyticsApi(analyticsApiMultipleEvents, {events: events})
}

const events = {}
eventNames.map(function (eventName) {
  events[eventName] = function (properties) {
    return postSingle(eventName, properties)
  }
})
export default events

async function _postToAnalyticsApi (api, payload) {
  const body = JSON.stringify(payload)
  trace(`analytics event(s) ${body}`)
  if (!OFFLINE_DEV) {
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
}

import moment from 'moment'
import { isSet, getInt, getString, setString, unset, keys } from './prefs'
import analytics from './analytics'
import { bearerTokenExpirySafetyMargin } from './config'

/**
 * This cache reads and writes to user preferences, so it can be safely used
 * across plugin commands (which run in separate contexts).
 *
 * Note: Add-ons are allowed 500 access token requests every 5 minutes for each
 * host product the add-on is installed on.
 * https://developer.atlassian.com/cloud/jira/software/oauth-2-jwt-bearer-token-authorization-grant-type/#rate-limiting
 */
export default class TokenCache {
  constructor (getNewToken) {
    this.getNewToken = getNewToken
  }
  async get (force) {
    const now = moment.utc().unix()
    if (force) {
      analytics.bearerTokenForceRefresh()
    } else {
      if (isSet(keys.authToken, keys.authTokenExpiry)) {
        const token = getString(keys.authToken)
        const expiry = getInt(keys.authTokenExpiry)
        if (expiry > now) {
          analytics.bearerTokenCacheHit()
          return token
        }
      }
      analytics.bearerTokenCacheMiss()
    }
    const newToken = await this.getNewToken()
    setString(keys.authToken, newToken[0])
    setString(keys.authTokenExpiry, now + newToken[1] - bearerTokenExpirySafetyMargin)
    return newToken[0]
  }
  flush () {
    analytics.bearerTokenCacheFlush()
    unset(keys.authToken, keys.authTokenExpiry)
  }
}

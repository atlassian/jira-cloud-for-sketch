import moment from 'moment'
import { isSet, getInt, getString, setString, unset, keys } from './prefs'
import { trace } from './logger'
import { bearerTokenExpirySafetyMargin } from './config'

/**
 * Retrieves and caches auth tokens, to avoid making the user wait for an auth
 * token each time they start interacting with the plugin.
 *
 * Note: Add-ons are allowed 500 access token requests every 5 minutes for each
 * host product the add-on is installed on. Eagerly fetching tokens may become
 * problematic for companies with one Jira Cloud site and >500 concurrent Sketch
 * users.
 *
 * @see https://developer.atlassian.com/cloud/jira/software/oauth-2-jwt-bearer-token-authorization-grant-type/#rate-limiting
 */
export default class TokenCache {
  /**
   * @param {function} getNewToken a reentrant function that can be used to
   * retrieve a new auth token
   */
  constructor (getNewToken) {
    this.getNewToken = getNewToken
  }
  /**
   * @param {boolean} force skip & ovewrite the cache
   * @return {string} an auth token
   */
  async get (force) {
    const now = moment.utc().unix()
    if (force) {
      trace('bearerTokenForceRefresh')
    } else {
      if (isSet(keys.authToken, keys.authTokenExpiry)) {
        const token = getString(keys.authToken)
        const expiry = getInt(keys.authTokenExpiry)
        if (expiry > now) {
          trace('bearerTokenCacheHit')
          return token
        }
      }
      trace('bearerTokenCacheMiss')
    }
    const newToken = await this.getNewToken()
    setString(keys.authToken, newToken[0])
    setString(keys.authTokenExpiry, now + newToken[1] - bearerTokenExpirySafetyMargin)
    return newToken[0]
  }
  /**
   * Clear the token cache
   */
  flush () {
    unset(keys.authToken, keys.authTokenExpiry)
  }
}

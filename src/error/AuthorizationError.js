/**
 * Indicates there is a problem with the user's authorization status with Jira,
 * e.g. the user has revoked the plugin's authorization via their Jira profile
 * page. If thrown, the plugin UI should allow the user to reauthorize with
 * Jira.
 */
export default class AuthorizationError {
  constructor (message) {
    this.name = 'AuthorizationError'
    this.message = message
    this.stack = new Error().stack
  }
}

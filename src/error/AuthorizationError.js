/**
 * Indicates there is a problem with the user's authorization status with JIRA,
 * e.g. the user has revoked the plugin's authorization via their JIRA profile
 * page. If thrown, the plugin UI should allow the user to reauthorize with
 * JIRA.
 */
export default class AuthorizationError {
  constructor (message) {
    this.name = 'AuthorizationError'
    this.message = message
    this.stack = new Error().stack
  }
}

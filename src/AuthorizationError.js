export default class AuthorizationError {
  constructor (message) {
    this.name = 'AuthorizationError'
    this.message = message
    this.stack = new Error().stack
  }
}

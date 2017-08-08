import { observable } from 'mobx'
import bridgedFunctionCall from '../../../bridge/client'
import { analytics } from '../../util'

const _getJiraUrl = bridgedFunctionCall('getJiraUrl')
const _setJiraUrl = bridgedFunctionCall('setJiraUrl')
const _authorizationComplete = bridgedFunctionCall('authorizationComplete')
const _testAuthorization = bridgedFunctionCall('testAuthorization')
const _getAuthorizationUrl = bridgedFunctionCall('getAuthorizationUrl')
const _awaitAuthorization = bridgedFunctionCall('awaitAuthorization')
const _openInBrowser = bridgedFunctionCall('openInBrowser')

export default class ViewModel {
  @observable initializing = true
  @observable error = null
  @observable loading = false
  @observable jiraUrl = ''
  @observable authUrl = ''

  constructor () {
    this.init()
  }

  async init () {
    this.jiraUrl = await _getJiraUrl()
    this.initializing = false
  }

  async connect () {
    if (this.authUrl && !this.error) {
      // if the user presses 'Connect' again, reopen the auth page
      return _openInBrowser(this.authUrl)
    }

    this.error = null
    this.authUrl = ''
    this.loading = true

    try {
      await _setJiraUrl(this.jiraUrl)
      if (await _testAuthorization()) {
        await _authorizationComplete()
      } else {
        this.authUrl = await _getAuthorizationUrl()
        _openInBrowser(this.authUrl)
        await _awaitAuthorization()
        await _authorizationComplete()
      }
    } catch (e) {
      this.error = e
      this.loading = false
    }
  }
}

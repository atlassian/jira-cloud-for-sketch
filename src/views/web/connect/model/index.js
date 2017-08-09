import { observable, computed } from 'mobx'
import bridgedFunctionCall from '../../../bridge/client'
import { analytics, truncateWithEllipsis } from '../../util'

const _getJiraUrl = bridgedFunctionCall('getJiraUrl')
const _setJiraUrl = bridgedFunctionCall('setJiraUrl')
const _authorizationComplete = bridgedFunctionCall('authorizationComplete')
const _testAuthorization = bridgedFunctionCall('testAuthorization')
const _getAuthorizationUrl = bridgedFunctionCall('getAuthorizationUrl')
const _awaitAuthorization = bridgedFunctionCall('awaitAuthorization')
const _openInBrowser = bridgedFunctionCall('openInBrowser')
const _openFaqPage = bridgedFunctionCall('openFaqPage')

const maxErrorMessageLength = 30

export default class ViewModel {
  @observable initializing = true
  @observable loading = false
  @observable error = null
  @observable jiraUrl = ''
  @observable authUrl = null

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
    this.authUrl = null
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

  @computed get truncatedErrorMessage () {
    return truncateWithEllipsis(this.errorMessage, maxErrorMessageLength)
  }

  @computed get errorMessage () {
    return this.error && (this.error.message || this.error.name)
  }

  async moreInfo () {
    if (this.error && this.error.faqTopic) {
      _openFaqPage(this.error.faqTopic)
    }
  }
}

import { observable, computed } from 'mobx'
import { bridgedFunction, markBridgeAsInitialized } from '../../../bridge/client'
import { analytics, truncateWithEllipsis, retryUntilTruthy } from '../../util'

const _getJiraUrl = bridgedFunction('getJiraUrl')
const _setJiraUrl = bridgedFunction('setJiraUrl')
const _authorizationComplete = bridgedFunction('authorizationComplete')
const _testAuthorization = bridgedFunction('testAuthorization')
const _getAuthorizationUrl = bridgedFunction('getAuthorizationUrl')
const _openInBrowser = bridgedFunction('openInBrowser')
const _openFaqPage = bridgedFunction('openFaqPage')
const _config = bridgedFunction('config')

const maxErrorMessageLength = 30

export default class ViewModel {
  @observable initializing = true
  @observable loading = false
  @observable error = null
  @observable jiraUrl = ''
  @observable authUrl = null
  @observable config = null

  constructor () {
    this.init()
  }

  async init () {
    markBridgeAsInitialized()
    this.config = await _config()
    this.jiraUrl = await _getJiraUrl()
    this.initializing = false
  }

  async connect () {
    if (this.authUrl && !this.error) {
      // if the user presses 'Connect' again, reopen the auth page
      analytics('clickConnectAgain')
      return _openInBrowser(this.authUrl)
    }

    this.error = null
    this.authUrl = null
    this.loading = true

    try {
      await _setJiraUrl(this.jiraUrl)
      if (await _testAuthorization()) {
        analytics('clickConnectAlreadyAuthorized')
      } else {
        this.authUrl = await _getAuthorizationUrl()
        _openInBrowser(this.authUrl)
        analytics('clickConnectStartDance')
        await retryUntilTruthy(
          _testAuthorization,
          0,
          this.config.userAuthorizationPollInterval
        )
        analytics('clickConnectFinishDance')
      }
      await _authorizationComplete()
    } catch (e) {
      this.error = e
      this.loading = false
      analytics(`connectError_${e.name}`)
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
      analytics('openFaq_' + this.error.faqTopic)
      _openFaqPage(this.error.faqTopic)
    }
  }
}

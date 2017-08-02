import { observable } from 'mobx'
import bridgedFunctionCall from '../../../bridge/client'
import { analytics } from '../../util'

const _connectOrGetAuthUrl = bridgedFunctionCall('connectOrGetAuthUrl')
const _awaitAuthorization = bridgedFunctionCall('awaitAuthorization')
const _openInBrowser = bridgedFunctionCall('openInBrowser')

export default class ViewModel {
  @observable error = null
  @observable loading = false
  @observable jiraUrl = ''
  @observable authUrl = ''

  async connect () {
    if (this.authUrl && !this.error) {
      // if the user presses 'Connect' again, reopen the auth page
      return _openInBrowser(this.authUrl)
    }
    this.error = null
    this.authUrl = ''
    this.loading = true
    try {
      this.authUrl = await _connectOrGetAuthUrl(this.jiraUrl)
      if (this.authUrl) {
        await _openInBrowser(this.authUrl)
        await _awaitAuthorization()
      }
    } catch (e) {
      this.error = e
      this.loading = false
    }
  }
}

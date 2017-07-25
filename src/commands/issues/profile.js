import { executeSafelyAsync } from '../../util'
import analytics from '../../analytics'

export default class Profile {
  constructor (context, webUI, jira) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
  }

  async loadProfile () {
    executeSafelyAsync(this.context, async () => {
      const profile = await this.jira.getProfile()
      this.webUI.dispatchWindowEvent('jira.profile.loaded', { profile })
      analytics.viewIssueProfileLoaded()
    })
  }
}

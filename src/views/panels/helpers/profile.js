export default class Profile {
  constructor (context, webUI, jira) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
  }

  async loadProfile () {
    return this.jira.getProfile()
  }
}

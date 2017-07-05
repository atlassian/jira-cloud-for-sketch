import { executeSafelyAsync } from '../../util'

export default class Attachments {
  constructor (context, webUI, jira) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
  }

  async loadAttachments (issueKey) {
    executeSafelyAsync(this.context, async () => {
      const issue = await this.jira.getIssue(issueKey)
      const attachments = issue.fields.attachment
      this.webUI.dispatchWindowEvent('jira.attachment.details', {
        issueKey,
        attachments
      })
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i]
        if (attachment.thumbnail && attachment.mimeType) {
          this.webUI.dispatchWindowEvent('jira.attachment.thumbnail', {
            issueKey,
            id: attachment.id,
            dataUri: await this.jira.getImageAsDataUri(
              attachment.thumbnail,
              attachment.mimeType
            )
          })
        }
      }
    })
  }
}

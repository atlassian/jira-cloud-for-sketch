import { executeSafelyAsync, openInDefaultApp } from '../../util'
import { thumbnailDownloadConcurrency } from '../../config'
import analytics, { postMultiple, event } from '../../analytics'
import { map } from 'bluebird'

export default class Attachments {
  constructor (context, webUI, jira) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
  }

  async reloadAttachments (issueKey) {
    executeSafelyAsync(this.context, async () => {
      const issue = await this.jira.getIssue(issueKey, {fields: ['attachment']})
      const attachments = issue.fields.attachment
      this.webUI.dispatchWindowEvent('jira.attachment.reloaded', {
        issueKey,
        attachments
      })
      postAnalytics(attachments)
      map(
        attachments.filter(attachment => attachment.thumbnail && attachment.mimeType),
        async (attachment) => {
          this.webUI.dispatchWindowEvent('jira.attachment.thumbnail', {
            issueKey,
            id: attachment.id,
            dataUri: await this.jira.getImageAsDataUri(
              attachment.thumbnail,
              attachment.mimeType
            )
          })
        },
        { concurrency: thumbnailDownloadConcurrency }
      )
    })
  }

  async deleteAttachment (issueKey, id) {
    executeSafelyAsync(this.context, async () => {
      await this.jira.deleteAttachment(id)
      this.reloadAttachments(issueKey)
    })
  }

  async openAttachment (issueKey, url, filename) {
    executeSafelyAsync(this.context, async () => {
      const eventPayload = { issueKey, url }
      this.webUI.dispatchWindowEvent('jira.attachment.downloading', eventPayload)
      const filepath = await this.jira.downloadAttachment(url, filename)
      this.webUI.dispatchWindowEvent('jira.attachment.opened', eventPayload)
      openInDefaultApp(filepath)
      analytics.viewIssueAttachmentOpen()
    })
  }
}

async function postAnalytics (attachments) {
  var analyticsEvents = attachments.map((attachment) => {
    return event('viewIssueAttachmentLoaded', {
      mimeType: attachment.mimeType,
      thumbnail: attachment.thumbnail && true,
      size: attachment.size
    })
  })
  analyticsEvents.push(event('viewIssueAttachmentsLoaded', {count: attachments.length}))
  postMultiple(analyticsEvents)
}

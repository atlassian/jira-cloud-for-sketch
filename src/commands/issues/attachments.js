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
      const attachments = issue.attachments
      this.webUI.dispatchWindowEvent('jira.attachments.loaded', {
        issueKey,
        attachments
      })
      postAnalytics(attachments)
      await map(
        attachments,
        async (attachment) => { return this.loadThumbnail(issueKey, attachment) },
        { concurrency: thumbnailDownloadConcurrency }
      )
    })
  }

  async loadThumbnail (issueKey, attachment) {
    if (attachment.thumbnail && attachment.mimeType) {
      this.webUI.dispatchWindowEvent('jira.thumbnail.loaded', {
        issueKey,
        id: attachment.id,
        dataUri: await this.jira.getImageAsDataUri(
          attachment.thumbnail,
          attachment.mimeType
        )
      })
    }
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

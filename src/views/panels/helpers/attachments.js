import { executeSafelyAsync, openInDefaultApp } from '../../../util'
import { thumbnailDownloadConcurrency } from '../../../config'
import analytics, { postMultiple, event } from '../../../analytics'
import { map } from 'bluebird'

export default class Attachments {
  constructor (context, webUI, jira) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
  }

  async touchIssueAndReloadAttachments (issueKey) {
    const issue = await this.jira.getIssue(issueKey, { updateHistory: true })
    issue.attachments.forEach(attachment => {
      attachment.issueKey = issueKey
    })
    postAnalytics(issue.attachments)
    // TODO migrate thumbnail loading away from events
    map(
      issue.attachments,
      async (attachment) => { return this.loadThumbnail(issueKey, attachment) },
      { concurrency: thumbnailDownloadConcurrency }
    )
    return issue
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

  async deleteAttachment (issueKey, attachmentId, isReplace) {
    executeSafelyAsync(this.context, async () => {
      await this.jira.deleteAttachment(attachmentId)
      if (!isReplace) {
        this.webUI.dispatchWindowEvent('jira.delete.complete', {
          issueKey,
          attachmentId
        })
      }
    })
  }

  async openAttachment (url, filename, progress) {
    const filepath = await this.jira.downloadAttachment(url, filename, (completed, total) => {
      progress(completed / total)
    })
    openInDefaultApp(filepath)
    analytics.viewIssueAttachmentOpen()
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

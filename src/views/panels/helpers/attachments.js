import { openInDefaultApp } from '../../../util'
import analytics, { postMultiple, event } from '../../../analytics'

export default class Attachments {
  constructor (context, webUI, jira) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
  }

  async touchIssueAndReloadAttachments (issueKey) {
    const issue = await this.jira.getIssue(issueKey, { updateHistory: true })
    postAnalytics(issue.attachments)
    return issue
  }

  // TODO queue requests
  async getThumbnail (url, mimeType) {
    return this.jira.getImageAsDataUri(url, mimeType)
  }

  async deleteAttachment (attachmentId) {
    await this.jira.deleteAttachment(attachmentId)
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

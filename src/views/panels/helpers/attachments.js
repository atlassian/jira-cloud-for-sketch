import { openInDefaultApp, sleep } from '../../../util'
import { trace } from '../../../logger'
import analytics, { postMultiple, event } from '../../../analytics'
import {
  thumbnailDownloadConcurrency,
  thumbnailRetryDelay,
  thumbnailRetryMax
} from '../../../config'
import Queue from 'promise-queue'
import blankThumbnailDataUri from '../../../blank-thumbnail-datauri.txt'

export default class Attachments {
  constructor (context, webUI, jira) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
    this.thumbnailQueue = new Queue(thumbnailDownloadConcurrency, Infinity)
  }

  async getIssue (issueKey, updateHistory) {
    const issue = await this.jira.getIssue(issueKey, { updateHistory })
    postAnalytics(issue.attachments)
    return issue
  }

  async getThumbnail (url, mimeType) {
    var attempts = thumbnailRetryMax
    let dataUri
    do {
      dataUri = await this.thumbnailQueue.add(async () => {
        return this.jira.getImageAsDataUri(url, mimeType)
      })
      if (dataUri != blankThumbnailDataUri) {
        break
      }
      // ASP-13 - JIRA often returns blank thumbnails for a short period
      // immediately after an attachment is uploaded
      trace(`Blank thumbnail! Retry in ${thumbnailRetryDelay} (${attempts} attempts left)`)
      await sleep(thumbnailRetryDelay)
    } while (--attempts)
    return dataUri
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

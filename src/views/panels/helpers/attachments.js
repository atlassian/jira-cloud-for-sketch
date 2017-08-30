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

/**
 * Handles operations on attachments that already exist in JIRA.
 */
export default class Attachments {
  constructor (context, webUI, jira) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
    this.thumbnailQueue = new Queue(thumbnailDownloadConcurrency, Infinity)
  }

  /**
   * @param {string} issueKey identifies the issue to retrieve
   * @param {boolean} updateHistory whether to update JIRA's 'recent issues'
   * list (which is used by the plugin's Recently Viewed filter)
   * @return {Promise<object>} the issue
   */
  async getIssue (issueKey, updateHistory) {
    const issue = await this.jira.getIssue(issueKey, { updateHistory })
    postAnalytics(issue.attachments)
    return issue
  }

  /**
   * @param {string} url the URL of an attachment thumbnail (extracted from the
   * attachments field of an issue object)
   * @param {string} mimeType the mime type of the attachment
   * @return {Promise<string>} image data URI representation of an attachment thumbnail
   */
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

  /**
   * Deletes an issue attachment.
   * @param {string} attachmentId identifies the attachment to be deleted
   */
  async deleteAttachment (attachmentId) {
    await this.jira.deleteAttachment(attachmentId)
  }

  /**
   * Downloads an attachment into the user's Downloads directory, then
   * opens it using the default app for that file type.
   * @param {string} url the URL of an attachment's content (extracted from the
   * attachments field of an issue object)
   * @param {string} filename the desired filename to be saved as on disk
   * @param {function} progress a callback function periodically invoked with
   * the percentage of download complete (a Number between 0 and 1).
   */
  async openAttachment (url, filename, progress) {
    const filepath = await this.jira.downloadAttachment(url, filename, (completed, total) => {
      progress(completed / total)
    })
    openInDefaultApp(filepath)
    analytics.viewIssueAttachmentOpen()
  }
}

/**
 * Send analytics about the attachments' mime type, size, and whether it had a
 * thumbnail. DO NOT send any sensitive information such as the image's name,
 * thumbnail, content, or the user that uploaded it.
 * @param {Object[]} attachments an issue's attachments
 */
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

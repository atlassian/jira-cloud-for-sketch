import moment from 'moment'
import mime from 'mime-types'
import { map } from 'bluebird'
import {
  executeSafelyAsync,
  randomHex,
  fileAttributes
} from '../../util'
import { getDraggedFiles } from '../../pasteboard'
import { isTraceEnabled, trace } from '../../logger'
import { jiraDateMomentFormat, attachmentUploadConcurrency } from '../../config'
import { postMultiple, event } from '../../analytics'
import { attachmentFromRest } from '../../entity-mappers'

export default class Uploads {
  constructor (context, webUI, jira, attachments) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
    this.attachments = attachments
    this.pendingUploads = []
    this.uploading = false
  }

  async onFilesDropped (issueKey, replacedAttachmentId) {
    return executeSafelyAsync(this.context, async () => {
      const attachments = getDraggedFiles().map(fileUrlToUploadInfo)
      const upload = { issueKey, attachments }
      this.pendingUploads.push(upload)
      this.webUI.dispatchWindowEvent(
        'jira.upload.queued', {
          issueKey,
          attachments,
          replacedAttachmentId
        }
      )
      postAnalytics(upload, this.uploading)
      return this.processUploads()
    })
  }

  async processUploads () {
    return executeSafelyAsync(this.context, async () => {
      try {
        if (!this.uploading) {
          this.uploading = true
          while (this.pendingUploads.length > 0) {
            const upload = this.pendingUploads.shift()
            const issueKey = upload.issueKey
            await map(
              // process the array backwards, so pending uploads are always
              // displayed first in the UI
              upload.attachments.reverse(),
              async (attachment) => {
                trace(`attaching ${attachment.path} to ${issueKey}`)
                const resp = await this.jira.uploadAttachment(
                  issueKey,
                  attachment.path,
                  (completed, total) => {
                    this.webUI.dispatchWindowEvent('jira.upload.progress', {
                      issueKey,
                      attachmentId: attachment.id,
                      progress: completed / total
                    })
                  }
                )
                const json = await resp.json()
                if (isTraceEnabled()) {
                  trace(JSON.stringify(json))
                }
                const uploadedAttachment = attachmentFromRest(json[0])
                this.webUI.dispatchWindowEvent('jira.upload.complete', {
                  issueKey,
                  attachment: uploadedAttachment,
                  oldId: attachment.id
                })
                this.attachments.loadThumbnail(issueKey, uploadedAttachment)
              },
              { concurrency: attachmentUploadConcurrency }
            )
          }
        }
      } finally {
        this.uploading = false
      }
    })
  }
}

function fileUrlToUploadInfo (fileUrlString) {
  const fileUrl = NSURL.URLWithString(fileUrlString)
  const extension = fileUrl.pathExtension() + ''
  const path = fileUrl.path() + ''
  const attributes = fileAttributes(path)
  return {
    id: randomHex(0xffffffff),
    filename: fileUrl.lastPathComponent() + '',
    path,
    created: moment().format(jiraDateMomentFormat),
    extension,
    size: parseInt(attributes[NSFileSize] + ''),
    mimeType: mime.lookup(extension)
  }
}

async function postAnalytics (upload, alreadyUploading) {
  var events = upload.files.map(file => {
    return event(
      'viewIssueAttachmentUpload',
      file.extension ? {extension: file.extension} : null
    )
  })
  if (upload.files.length > 1) {
    events.push(event('viewIssueMultipleAttachmentUpload', {
      count: upload.files.length,
      alreadyUploading
    }))
  } else {
    events.push(event('viewIssueSingleAttachmentUpload', { alreadyUploading }))
  }
  postMultiple(events)
}

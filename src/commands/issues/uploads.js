import moment from 'moment'
import mime from 'mime-types'
import {
  executeSafelyAsync,
  randomHex,
  fileAttributes
} from '../../util'
import { getDraggedFiles } from '../../pasteboard'
import { isTraceEnabled, trace } from '../../logger'
import { jiraDateMomentFormat } from '../../config'
import { postMultiple, event } from '../../analytics'
import { attachmentFromRest } from '../../entity-mappers'

export default class Uploads {
  constructor (context, webUI, jira) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
    this.pendingUploads = []
    this.uploading = false
  }

  async onFilesDropped (issueKey) {
    return executeSafelyAsync(this.context, async () => {
      const attachments = getDraggedFiles().map(fileUrlToUploadInfo)
      const upload = { issueKey, attachments }
      this.pendingUploads.push(upload)
      this.webUI.dispatchWindowEvent(
        'jira.upload.queued', { issueKey, attachments }
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
            for (let i = 0; i < upload.attachments.length; i++) {
              const attachment = upload.attachments[i]
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
              this.webUI.dispatchWindowEvent('jira.upload.complete', {
                issueKey,
                attachment: attachmentFromRest(json[0]),
                oldId: attachment.id
              })
            }
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

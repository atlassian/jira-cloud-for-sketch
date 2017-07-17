import { executeSafelyAsync, normalizeFilepath } from '../../util'
import { getDraggedFiles } from '../../pasteboard'
import { trace } from '../../logger'
import { postMultiple, event } from '../../analytics'

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
      const upload = {
        issueKey: issueKey,
        files: getDraggedFiles()
      }
      this.pendingUploads.push(upload)
      this.webUI.dispatchWindowEvent('jira.upload.queued', {
        issueKey: issueKey,
        count: upload.files.length
      })
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
            for (let i = 0; i < upload.files.length; i++) {
              const filepath = normalizeFilepath(upload.files[i])
              var resp = await this.jira.uploadAttachment(upload.issueKey, filepath)
              trace(resp)
              this.webUI.dispatchWindowEvent('jira.upload.complete', {
                issueKey: upload.issueKey,
                count: 1
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

async function postAnalytics (upload, alreadyUploading) {
  var events = upload.files.map((file) => {
    var props = null
    var lastSlash = file.lastIndexOf('/')
    var extIndex = file.lastIndexOf('.')
    if (extIndex > lastSlash && extIndex < file.length() - 1) {
      props = {extension: file.substring(extIndex + 1)}
    }
    return event('viewIssueAttachmentUpload', props)
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

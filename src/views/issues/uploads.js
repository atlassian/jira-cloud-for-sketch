import { executeSafelyAsync, normalizeFilepath } from '../../util'
import { getDraggedFiles } from '../../pasteboard'
import { trace } from '../../logger'

export default class Uploads {
  constructor (context, webUI, jira) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
    this.pendingUploads = []
    this.uploading = false
  }

  async onFilesDropped (issueKey) {
    executeSafelyAsync(this.context, async () => {
      const upload = {
        issueKey: issueKey,
        files: getDraggedFiles()
      }
      this.pendingUploads.push(upload)
      this.webUI.dispatchWindowEvent('jira.upload.queued', {
        issueKey: issueKey,
        count: upload.files.length
      })
      this.processUploads()
    })
  }

  async processUploads () {
    executeSafelyAsync(this.context, async () => {
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

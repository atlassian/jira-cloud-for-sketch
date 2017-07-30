import { observable, computed } from 'mobx'
import { assign } from 'lodash'
import pluginCall from 'sketch-module-web-view/client'
import bridgedFunctionCall from '../../../bridge/client'
import getThumbnail from './thumbnails'

const _uploadAttachment = bridgedFunctionCall('uploadAttachment')
const _openAttachment = bridgedFunctionCall('openAttachment')

export default class Attachment {
  @observable uploading = false
  @observable downloading = false
  @observable deleting = false
  @observable progress = 0
  @observable thumbnailDataUri = null

  constructor (attachment, doUpload) {
    assign(this, attachment)
    this.loadThumbnail()
  }

  async loadThumbnail () {
    this.thumbnailDataUri = await getThumbnail(this)
  }

  async upload () {
    this.uploading = true
    const uploaded = await _uploadAttachment(this.key, this, progress => {
      this.progress = progress
    })
    assign(this, uploaded)
    this.uploading = false
    this.loadThumbnail()
  }

  @computed get cardStatus () {
    if (this.deleting) {
      return 'processing'
    } else if (this.uploading || this.downloading) {
      // there's no 'downloading' status, so use uploading to show progress
      return 'uploading'
    } else {
      return 'complete'
    }
  }

  @computed get readyForAction () {
    return !(this.deleting || this.uploading || this.downloading)
  }

  async open () {
    if (this.readyForAction) {
      this.downloading = true
      this.progress = 0
      await _openAttachment(this.content, this.filename, progress => {
        this.progress = progress
      })
      this.downloading = false
    }
  }

  delete () {
    if (this.readyForAction) {
      this.deleting = true
      pluginCall('deleteAttachment', this.id)
    }
  }

  replace () {
    if (this.readyForAction) {
      this.deleting = true
      // files are looked up via the system drag pasteboard
      pluginCall('replaceAttachment', this.id)
    }
  }
}

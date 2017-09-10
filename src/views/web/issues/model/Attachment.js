import { observable, computed } from 'mobx'
import { assign } from 'lodash'
import { bridgedFunction } from '../../../bridge/client'
import getThumbnail from './thumbnails'
import { analytics, sleep } from '../../util'

const _uploadAttachment = bridgedFunction('uploadAttachment')
const _openAttachment = bridgedFunction('openAttachment')
const _deleteAttachment = bridgedFunction('deleteAttachment')

export default class Attachment {
  @observable uploading = false
  @observable downloading = false
  @observable animatingDelete = false
  @observable deleteAnimationDelay = 0.2 // seconds
  @observable deleting = false
  @observable progress = 0
  @observable thumbnailDataUri = null
  @observable id = null

  constructor (attachment, doUpload) {
    assign(this, attachment)
  }

  async loadThumbnail () {
    if (!this.thumbnailDataUri) {
      this.thumbnailDataUri = await getThumbnail(this)
    }
  }

  async upload (issueKey) {
    this.uploading = true
    const uploaded = await _uploadAttachment(issueKey, this, progress => {
      this.progress = progress
    })
    analytics(
      this.extension
        ? `attachFileWithExtension_${this.extension.toLowerCase()}`
        : 'attachFileWithoutExtension',
      {size: this.size}
    )
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
    return !(this.animatingDelete || this.deleting || this.uploading || this.downloading)
  }

  async open () {
    if (this.readyForAction) {
      this.downloading = true
      analytics('downloadAttachment')
      this.progress = 0
      await _openAttachment(this.content, this.filename, progress => {
        this.progress = progress
      })
      this.downloading = false
    }
  }

  /**
   * @param {boolean} replace indicates this is part of a replace operation,
   * and should skip animation & analytics.
   */
  async delete (replace) {
    if (this.readyForAction) {
      if (!replace) {
        this.animatingDelete = true
        analytics('deleteAttachment')
        await sleep(this.deleteAnimationDelayMs)
      }
      try {
        this.deleting = true
        await _deleteAttachment(this.id)
      } catch (e) {
        this.animatingDelete = false
        this.deleting = false
        throw e
      }
    }
  }

  @computed get deleteAnimationDelayMs () {
    return this.deleteAnimationDelay * 1000
  }

  @computed get visible () {
    return !this.deleting
  }
}

import { observable, computed } from 'mobx'
import { assign } from 'lodash'
import pluginCall from 'sketch-module-web-view/client'

export default class Attachment {
  @observable uploading = false
  @observable downloading = false
  @observable deleting = false
  @observable progress = 0
  @observable thumbnailDataUri = null

  constructor (issueKey, attachment) {
    this.issueKey = issueKey
    assign(this, attachment)
  }

  @computed get cardStatus () {
    if (this.deleting) {
      return 'processing'
    } else if (this.uploading) {
      return 'uploading'
    } else {
      return 'complete'
    }
  }

  open () {
    if (!this.deleting && !this.uploading) {
      // TODO downloading progress
      pluginCall('openAttachment', this.issueKey, this.content, this.filename)
    }
  }

  delete () {
    if (!this.deleting && !this.uploading) {
      this.deleting = true
      pluginCall('deleteAttachment', this.issueKey, this.id)
    }
  }

  replace () {
    if (!this.deleting && !this.uploading) {
      this.deleting = true
      // the file isn't passed through, it's looked up from the drag pasteboard
      pluginCall('replaceAttachment', this.issueKey, this.id)
    }
  }
}

import { observable, computed } from 'mobx'
import { assign } from 'lodash'
import pluginCall from 'sketch-module-web-view/client'

export default class Attachment {
  @observable uploading = false
  @observable downloading = false
  @observable deleting = false
  @observable progress = 0
  @observable thumbnailDataUri = null

  @computed get cardStatus () {
    if (this.deleting) {
      return 'processing'
    } else if (this.thumbnailDataUri || !this.thumbnail) {
      return 'complete'
    } else {
      return 'loading'
    }
  }

  open () {
    if (!this.deleting) {
      // TODO downloading progress
      pluginCall('openAttachment', this.issueKey, this.content, this.filename)
    }
  }

  delete () {
    if (!this.deleting) {
      this.deleting = true
      pluginCall('deleteAttachment', this.issueKey, this.id)
    }
  }

  replace () {
    if (!this.deleting) {
      this.deleting = true
      // the file isn't passed through, it's looked up from the drag pasteboard
      pluginCall('replaceAttachment', this.issueKey, this.id)
    }
  }

  constructor (issueKey, attachment) {
    this.issueKey = issueKey
    assign(this, attachment)
  }
}

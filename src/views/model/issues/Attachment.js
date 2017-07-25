import { observable } from 'mobx'
import { assign } from 'lodash'

export default class Attachment {
  @observable uploading = false
  @observable downloading = false
  @observable progress = 0
  @observable thumbnailDataUri = null

  constructor (attachment) {
    assign(this, attachment)
  }
}

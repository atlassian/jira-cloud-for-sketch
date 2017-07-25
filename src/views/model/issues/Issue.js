import { observable } from 'mobx'
import { forOwn } from 'lodash'
import Attachment from './Attachment'

export default class Issue {
  @observable attachments = []
  @observable commentText = null
  @observable postingComment = false
  @observable latestComment = null

  constructor (issue) {
    forOwn(issue, (value, key) => {
      switch (key) {
        case 'attachments':
          this.attachments.replace(value.map(attachment => new Attachment(attachment)))
          break
        default:
          this[key] = value
      }
    })
  }
}

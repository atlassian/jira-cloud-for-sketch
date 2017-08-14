import { observable, computed } from 'mobx'
import { assign } from 'lodash'
import bridgedFunctionCall from '../../../bridge/client'
import { IssueMapper, AttachmentsMapper } from './mapper'
import CommentEditor from './CommentEditor'
import { analytics } from '../../util'

const _touchIssueAndReloadAttachments = bridgedFunctionCall(
  'touchIssueAndReloadAttachments', IssueMapper
)
const _getDroppedFiles = bridgedFunctionCall('getDroppedFiles', AttachmentsMapper)
const _openInBrowser = bridgedFunctionCall('openInBrowser')

export default class Issue {
  @observable attachments = []

  constructor (issue, attachments) {
    assign(this, issue)
    this.attachments.replace(attachments)
    this.commentEditor = new CommentEditor(this.key)
  }

  async onSelected () {
    this.loadThumbnails()
    const issue = await _touchIssueAndReloadAttachments(this.key)
    // convert from @observable array to real array TODO this could be nicer!
    const newAttachments = [].slice.call(issue.attachments)
    // retain attachments that are currently uploading
    this.attachments.replace(
      this.attachments.filter(attachment => {
        return attachment.uploading
      }).concat(newAttachments)
    )
    // in case of new attachments (pre-existing will hit the cache)
    this.loadThumbnails()
    analytics('viewIssue')
  }

  async loadThumbnails () {
    this.attachments.forEach(attachment => {
      if (!attachment.uploading) {
        attachment.loadThumbnail()
      }
    })
  }

  async uploadDroppedFiles (replacedAttachment) {
    const droppedFiles = await _getDroppedFiles()
    let insertAt = 0
    if (replacedAttachment) {
      insertAt = Math.max(0, this.attachments.indexOf(replacedAttachment))
      replacedAttachment.delete()
      analytics('viewIssueAttachmentReplace')
    }
    droppedFiles.forEach(file => {
      file.upload(this.key)
      this.attachments.splice(insertAt, 0, file)
    })
  }

  @computed get browseUrl () {
    var baseUrl = this.self.substring(0, this.self.indexOf('/rest/'))
    return `${baseUrl}/browse/${this.key}`
  }

  openInBrowser () {
    _openInBrowser(this.browseUrl)
    analytics('viewIssueOpenInBrowser')
  }
}

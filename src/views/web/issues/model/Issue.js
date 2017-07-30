import { observable, computed } from 'mobx'
import { assign, find, findIndex } from 'lodash'
import pluginCall from 'sketch-module-web-view/client'
import bridgedFunctionCall from '../../../bridge/client'
import { IssueMapper } from './mapper'
import { analytics } from './util'

const _touchIssueAndReloadAttachments = bridgedFunctionCall(
  'touchIssueAndReloadAttachments', IssueMapper
)

export default class Issue {
  @observable attachments = []
  @observable commentText = ''
  @observable postingComment = false
  @observable postedCommentHref = null

  constructor (issue, attachments) {
    assign(this, issue)
    this.attachments.replace(attachments)
  }

  async onSelected () {
    const issue = await _touchIssueAndReloadAttachments(this.key)
    // convert from @observable array to real array TODO this could be nicer!
    const newAttachments = [].slice.call(issue.attachments)
    // retain attachments that are currently uploading
    this.attachments.replace(
      this.attachments.filter(attachment => {
        return attachment.uploading
      }).concat(newAttachments)
    )
    analytics('viewIssue')
  }

  uploadDroppedFiles () {
    pluginCall('uploadDroppedFiles', this.key)
  }

  indexOfAttachment (attachmentId) {
    return findIndex(this.attachments, attachment => {
      return attachment.id === attachmentId
    })
  }

  onUploadsQueued (attachments, replacedAttachmentId) {
    attachments.forEach(attachment => { attachment.uploading = true })
    let idx
    if (replacedAttachmentId &&
       (idx = this.indexOfAttachment(replacedAttachmentId)) > -1) {
      this.attachments.splice(idx, 1, ...attachments)
    } else {
      this.attachments.unshift(...attachments)
    }
  }

  onUploadComplete (attachment, oldId) {
    const idx = this.indexOfAttachment(oldId)
    if (idx > -1) {
      this.attachments.splice(idx, 1, attachment)
    }
  }

  @computed get browseUrl () {
    var baseUrl = this.self.substring(0, this.self.indexOf('/rest/'))
    return `${baseUrl}/browse/${this.key}`
  }

  openInBrowser () {
    pluginCall('openInBrowser', this.browseUrl)
    pluginCall('analytics', 'viewIssueOpenInBrowser')
  }

  openPostedCommentInBrowser () {
    if (this.postedCommentHref) {
      pluginCall('openInBrowser', this.postedCommentHref)
      pluginCall('analytics', 'viewIssueOpenCommentInBrowser')
    }
  }

  postComment () {
    if (!this.postingComment && this.commentText.trim()) {
      this.postingComment = true
      this.postedCommentHref = null
      pluginCall('addComment', this.key, this.commentText)
    }
  }

  onCommentAdded (href) {
    this.commentText = ''
    this.postingComment = false
    this.postedCommentHref = href
  }
}

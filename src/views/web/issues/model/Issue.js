import { observable, computed } from 'mobx'
import { assign } from 'lodash'
import bridgedFunctionCall from '../../../bridge/client'
import { IssueMapper, AttachmentsMapper } from './mapper'
import { analytics } from '../../util'

const _touchIssueAndReloadAttachments = bridgedFunctionCall(
  'touchIssueAndReloadAttachments', IssueMapper
)
const _getDroppedFiles = bridgedFunctionCall('getDroppedFiles', AttachmentsMapper)
const _openInBrowser = bridgedFunctionCall('openInBrowser')
const _findUsersForPicker = bridgedFunctionCall('findUsersForPicker')
const _addComment = bridgedFunctionCall('addComment')

export default class Issue {
  @observable attachments = []
  @observable commentText = ''
  @observable postingComment = false
  @observable postedCommentHref = null
  @observable mentions = []

  constructor (issue, attachments) {
    assign(this, issue)
    this.attachments.replace(attachments)
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

  openPostedCommentInBrowser () {
    if (this.postedCommentHref) {
      _openInBrowser(this.postedCommentHref)
      analytics('viewIssueOpenCommentInBrowser')
    }
  }

  onCommentTextChanged (newText, mention) {
    this.commentText = newText
    if (mention) {
      this.loadMentions(mention)
    } else {
      this.clearMentions()
    }
  }

  async loadMentions (query) {
    this.loadingMentionQuery = query
    const users = await _findUsersForPicker(query)
    if (this.loadingMentionQuery === query) {
      this.mentions.replace(users.map(user => {
        // HACK: JIRA returns tiny avatars by default. Here we verride the 's'
        // parameter to get the desired resolution
        const avatarUrl32px = user.avatarUrl.replace(/[?&]s=\d+/, str => {
          return str.charAt(0) + 's=32'
        })
        return {
          id: user.key,
          avatarUrl: avatarUrl32px,
          name: user.displayName,
          mentionName: user.name,
          nickname: user.name
        }
      }))
    }
  }

  clearMentions () {
    console.log('clearing mentions')
    this.loadingMentionQuery = null
    this.mentions.replace([])
  }

  async onMentionSelected (selection) {
    console.log(selection)
  }

  async postComment () {
    if (!this.postingComment && this.commentText.trim()) {
      this.postingComment = true
      this.postedCommentHref = await _addComment(this.key, this.commentText)
      this.commentText = ''
      this.postingComment = false
    }
  }
}

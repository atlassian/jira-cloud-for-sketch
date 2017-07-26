import { observable, computed } from 'mobx'
import { assign } from 'lodash'
import pluginCall from 'sketch-module-web-view/client'

export default class Issue {
  @observable attachments = []
  @observable commentText = ''
  @observable postingComment = false
  @observable postedCommentHref = null

  constructor (issue, attachments) {
    assign(this, issue)
    this.attachments.replace(attachments)
  }

  uploadDroppedFiles () {
    pluginCall('uploadDroppedFiles', this.key)
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

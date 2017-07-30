import analytics from '../../../analytics'

export default class Comments {
  constructor (context, webUI, jira) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
  }

  async addComment (issueKey, comment) {
    analytics.viewIssueCommentAdd({
      length: comment.length,
      lines: comment.split('\n').length
    })
    return this.jira.addComment(issueKey, comment)
  }
}

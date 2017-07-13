import { executeSafelyAsync } from '../../util'
import analytics from '../../analytics'

export default class Comments {
  constructor (context, webUI, jira) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
  }

  async addComment (issueKey, comment) {
    executeSafelyAsync(this.context, async () => {
      const href = await this.jira.addComment(issueKey, comment)
      this.webUI.dispatchWindowEvent('jira.comment.added', {
        issueKey,
        href
      })
      analytics.viewIssueCommentAdd({
        length: comment.length,
        lines: comment.split('\n').length
      })
    })
  }
}

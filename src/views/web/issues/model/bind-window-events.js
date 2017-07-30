import { forOwn } from 'lodash'

export default function (viewModel) {
  const events = {
    'jira.comment.added': event => {
      const { issueKey, href } = event.detail
      viewModel.onCommentAdded(issueKey, href)
    }
  }
  forOwn(events, (func, key) => window.addEventListener(key, func))
  return function () {
    forOwn(events, (func, key) => window.removeEventListener(key, func))
  }
}

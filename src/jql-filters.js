export default {
  'recently-viewed': {
    displayName: 'Recently viewed',
    jql: 'issue in issueHistory() ' +
         'order by lastViewed'
  },
  'assigned-to-me': {
    displayName: 'Assigned to me',
    jql: 'assignee = currentUser() ' +
         'and resolution = Unresolved ' +
         'order by lastViewed'
  },
  'mentioning-me': {
    displayName: '@mentioning me',
    jql: 'text ~ currentUser() ' +
         'order by lastViewed'
  }
}

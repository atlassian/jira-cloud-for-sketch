export default {
  'RecentlyViewed': {
    displayName: 'Recently viewed',
    jql: 'issue in issueHistory() ' +
         'order by lastViewed'
  },
  'AssignedToMe': {
    displayName: 'Assigned to me',
    jql: 'assignee = currentUser() ' +
         'and resolution = Unresolved ' +
         'order by lastViewed'
  },
  'MentioningMe': {
    displayName: '@mentioning me',
    jql: 'text ~ currentUser() ' +
         'order by lastViewed'
  }
}

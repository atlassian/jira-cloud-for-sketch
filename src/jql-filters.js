import { forOwn, assign } from 'lodash'

const jqlFilters = {
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

const filterArray = []
forOwn(jqlFilters, (filter, key) => {
  filterArray.push(assign({key}, filter))
})

export default jqlFilters
export const jqlFilterArray = filterArray

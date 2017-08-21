import { postSingle } from '../../../analytics'
import { jqlFilterArray } from '../../../jql-filters'

export default class Filters {
  constructor (context, webUI, jira) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
    this.currentFilter = null
  }

  loadFilters () {
    return jqlFilterArray
  }

  async onFilterChanged (newFilter) {
    this.currentFilter = newFilter
    var issues = await this.jira.getFilteredIssues(newFilter)
    postSingle('viewIssueListFilterLoaded' + newFilter, {
      count: issues.length
    })
    return issues
  }
}

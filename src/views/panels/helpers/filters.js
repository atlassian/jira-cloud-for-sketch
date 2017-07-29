import { forOwn, assign } from 'lodash'
import { postSingle } from '../../../analytics'

export default class Filters {
  constructor (context, webUI, jira) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
    this.currentFilter = null
  }

  async loadFilters () {
    const filters = []
    forOwn(this.jira.jqlFilters, (filter, key) => {
      filters.push(assign({key}, filter))
    })
    return filters
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

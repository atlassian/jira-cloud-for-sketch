import { forOwn, assign } from 'lodash'
import { executeSafelyAsync } from '../../../util'
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
    executeSafelyAsync(this.context, async () => {
      this.currentFilter = newFilter
      var issues = await this.jira.getFilteredIssues(newFilter)
      // if another filter has been selected in the meantime, ignore the result
      if (newFilter == this.currentFilter) {
        this.webUI.dispatchWindowEvent('jira.issues.loaded', {
          issues: issues,
          filter: this.jira.jqlFilters[newFilter]
        })
        postSingle('viewIssueListFilterLoaded' + newFilter, {
          count: issues.length
        })
      }
    })
  }
}

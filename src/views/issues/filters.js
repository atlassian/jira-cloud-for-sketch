import { keys } from 'lodash'
import { executeSafelyAsync } from '../../util'
import { postSingle } from '../../analytics'

export default class Filters {
  constructor (context, webUI, jira) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
    this.currentFilter = null
  }

  async onReady () {
    executeSafelyAsync(this.context, () => {
      var defaultFilter = keys(this.jira.jqlFilters)[0]
      this.webUI.dispatchWindowEvent('jira.filters.updated', {
        filters: this.jira.jqlFilters,
        filterSelected: defaultFilter
      })
      this._onFilterChanged(defaultFilter)
      postSingle('viewIssueListDefaultFilter' + defaultFilter)
    })
  }

  async onFilterChanged (newFilter) {
    postSingle('viewIssueListFilterChangeTo' + newFilter, { previous: this.currentFilter })
    this._onFilterChanged(newFilter)
  }

  async _onFilterChanged (newFilter) {
    executeSafelyAsync(this.context, async () => {
      this.currentFilter = newFilter
      this.webUI.dispatchWindowEvent('jira.issues.loading', {
        filterKey: newFilter
      })
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

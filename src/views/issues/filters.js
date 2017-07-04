import { keys } from 'lodash'
import { executeSafelyAsync } from '../../util'

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
      this.onFilterChanged(defaultFilter)
    })
  }

  async onFilterChanged (newFilter) {
    executeSafelyAsync(this.context, async () => {
      this.currentFilter = newFilter
      this.webUI.dispatchWindowEvent('jira.issues.loading', {
        filterKey: newFilter
      })
      var issues = await this.jira.getFilteredIssues(newFilter)
      // if another filter has been selected in the meantime, ignore the result
      if (newFilter == this.currentFilter) {
        this.webUI.dispatchWindowEvent('jira.issues.loaded', {
          issues: issues
        })
      }
    })
  }
}

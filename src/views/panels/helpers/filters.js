import { postSingle } from '../../../analytics'
import { jqlFilterArray } from '../../../jql-filters'

/**
 * Retrieves filters, and filtered issues.
 */
export default class Filters {
  constructor (context, webUI, jira) {
    this.context = context
    this.webUI = webUI
    this.jira = jira
    this.currentFilter = null
  }

  /**
   * @return {Object[]} an array of available filters
   */
  loadFilters () {
    return jqlFilterArray
  }

  /**
   * @param {string} newFilter the key of the selected filter
   * @return {Promise<Object[]>} an array of issues matching the filter
   */
  async onFilterChanged (newFilter) {
    this.currentFilter = newFilter
    var issues = await this.jira.getFilteredIssues(newFilter)
    postSingle('viewIssueListFilterLoaded' + newFilter, {
      count: issues.length
    })
    return issues
  }
}

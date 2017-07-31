import { observable } from 'mobx'
import { find } from 'lodash'
import bridgedFunctionCall, { addGlobalErrorHandler } from '../../../bridge/client'
import { analytics } from './util'
import { FiltersMapper, IssuesMapper, ProfileMapper } from './mapper'

const _loadFilters = bridgedFunctionCall('loadFilters', FiltersMapper)
const _loadIssuesForFilter = bridgedFunctionCall('loadIssuesForFilter', IssuesMapper)
const _loadProfile = bridgedFunctionCall('loadProfile', ProfileMapper)

export default class ViewModel {
  @observable filters = {
    list: [],
    selected: null,
    loading: false
  }
  @observable issues = {
    list: [],
    selected: null,
    loading: false
  }
  @observable profile = null
  @observable error = null

  constructor () {
    this.loadFilters()
    this.loadProfile()
    this.registerGlobalErrorHandler()
  }

  async loadFilters () {
    this.filters.loading = true
    const filters = await _loadFilters()
    this.filters.list.replace(filters)
    if (!this.filters.selected && filters.length) {
      this.selectFilter(filters[0].key)
    }
    this.filters.loading = false
  }

  selectFilter (filterKey) {
    if (this.filters.selected) {
      analytics('viewIssueListFilterChangeTo' + filterKey, { previous: this.filters.selected })
    } else {
      analytics('viewIssueListDefaultFilter' + filterKey)
    }
    this.filters.selected = find(
      this.filters.list,
      filter => filter.key === filterKey
    )
    this.loadIssues()
  }

  async loadIssues () {
    if (this.filters.selected) {
      this.issues.loading = true
      this.issues.list.clear()
      const selectedKey = this.filters.selected.key
      const issues = await _loadIssuesForFilter(selectedKey)
      if (this.filters.selected.key === selectedKey) {
        this.issues.list.replace(issues)
        this.issues.loading = false
      }
    }
  }

  selectIssue (issue) {
    this.issues.selected = issue
    issue.onSelected()
  }

  deselectIssue () {
    this.issues.selected = null
    analytics('backToViewIssueList')
  }

  async loadProfile () {
    this.profile = await _loadProfile()
    analytics('viewIssueProfileLoaded')
  }

  registerGlobalErrorHandler () {
    addGlobalErrorHandler(error => {
      this.error = error
    })
  }
}

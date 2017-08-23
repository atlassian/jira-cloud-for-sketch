import { observable, computed } from 'mobx'
import { find } from 'lodash'
import bridgedFunctionCall, { addGlobalErrorHandler } from '../../../bridge/client'
import { analytics, truncateWithEllipsis } from '../../util'
import { FiltersMapper, IssuesMapper, ProfileMapper } from './mapper'

const _loadFilters = bridgedFunctionCall('loadFilters', FiltersMapper)
const _loadIssuesForFilter = bridgedFunctionCall('loadIssuesForFilter', IssuesMapper)
const _loadProfile = bridgedFunctionCall('loadProfile', ProfileMapper)
const _viewSettings = bridgedFunctionCall('viewSettings')
const _reauthorize = bridgedFunctionCall('reauthorize')
const _onIssueSelected = bridgedFunctionCall('onIssueSelected')
const _onIssueDeselected = bridgedFunctionCall('onIssueDeselected')

const maxErrorMessageLength = 55

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
  @observable retry = null
  @observable reauthorize = null

  constructor () {
    this.loadFilters()
    this.loadProfile()
    this.registerGlobalErrorHandler()
    this.registerExportEventHandler()
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

  async viewSettings () {
    _viewSettings()
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
    _onIssueSelected(issue.key)
  }

  deselectIssue () {
    const prevKey = this.issues.selected.key
    this.issues.selected = null
    _onIssueDeselected(prevKey)
    analytics('backToViewIssueList')
  }

  async loadProfile () {
    this.profile = await _loadProfile()
    analytics('viewIssueProfileLoaded')
  }

  @computed get truncatedErrorMessage () {
    return truncateWithEllipsis(this.errorMessage, maxErrorMessageLength)
  }

  @computed get errorMessage () {
    return this.error && (this.error.message || this.error.name)
  }

  registerGlobalErrorHandler () {
    addGlobalErrorHandler((error, retry) => {
      this.error = error
      if (error.name === 'AuthorizationError') {
        this.reauthorize = () => {
          _reauthorize()
        }
      } else {
        this.retry = () => {
          this.error = this.retry = null
          retry()
        }
      }
      // indicate that this error handler will facilitate retries
      return true
    })
  }

  registerExportEventHandler () {
    window.addEventListener('jira.export.selection.to.issue', event => {
      const { issueKey, files } = event.detail
      const issue = find(this.issues.list, issue => {
        return issue.key === issueKey
      })
      issue && issue.uploadExportedSelection(files)
    })
  }
}

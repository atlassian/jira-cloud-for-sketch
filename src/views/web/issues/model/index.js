import { observable, computed } from 'mobx'
import { find } from 'lodash'
import {
  bridgedFunction,
  addGlobalErrorHandler,
  exposeFunction,
  markBridgeAsInitialized
} from '../../../bridge/client'
import { analytics, analyticsBatch, truncateWithEllipsis } from '../../util'
import {
  FiltersMapper,
  IssuesMapper,
  IssueMapper,
  ProfileMapper
} from './mapper'

const _loadFilters = bridgedFunction('loadFilters', FiltersMapper)
const _loadIssuesForFilter = bridgedFunction('loadIssuesForFilter', IssuesMapper)
const _getSuggestedPreselectedIssueKey = bridgedFunction('getSuggestedPreselectedIssueKey')
const _getIssue = bridgedFunction('getIssue', IssueMapper)
const _loadProfile = bridgedFunction('loadProfile', ProfileMapper)
const _viewSettings = bridgedFunction('viewSettings')
const _reauthorize = bridgedFunction('reauthorize')
const _feedback = bridgedFunction('feedback')
const _onIssueSelected = bridgedFunction('onIssueSelected')
const _onIssueDeselected = bridgedFunction('onIssueDeselected')
const _openFaqPage = bridgedFunction('openFaqPage')
const _areLayersSelected = bridgedFunction('areLayersSelected')

const maxErrorMessageLength = 55

export default class ViewModel {
  @observable initialized = false
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
  @observable hasSelection = false

  constructor () {
    this.init()
  }

  async init () {
    this.registerGlobalErrorHandler()
    this.initializeExposedFunctions()
    this.loadProfile()
    this.checkIfHasSelection()

    await this.loadFilters()
    // Select the RecentlyViewed filter first. This is important, as if there
    // is a 'Suggested issue' in the context, it will be inserted as the first
    // entry in the list (see selectSuggestedIssue())
    await this.selectFilterByKey('RecentlyViewed')
    await this.selectSuggestedIssue()

    this.initialized = true
  }

  initializeExposedFunctions () {
    exposeFunction('exportSelectionToSelectedIssue', (issueKey, files) => {
      this.withIssue(issueKey, issue => {
        issue.uploadExportedSelection(files)
      })
    })
    exposeFunction('setHasSelection', hasSelection => {
      this.hasSelection = hasSelection
    })
    markBridgeAsInitialized()
  }

  async checkIfHasSelection () {
    this.hasSelection = await _areLayersSelected()
  }

  async loadFilters () {
    this.filters.loading = true
    const filters = await _loadFilters()
    filters.forEach(filter => {
      filter.select = () => {
        this.selectFilter(filter)
      }
    })
    this.filters.list.replace(filters)
    this.filters.loading = false
  }

  async selectFilterByKey (filterKey) {
    return this.selectFilter(
      find(this.filters.list, filter => {
        return filter.key === filterKey
      })
    )
  }

  async selectFilter (filter) {
    if (this.filters.selected) {
      analytics('changeFilterTo_' + filter.key)
    }
    this.filters.selected = filter
    return this.loadIssues()
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

  async selectSuggestedIssue () {
    const suggestedIssueKey = await _getSuggestedPreselectedIssueKey()
    const suggestedIssue = suggestedIssueKey && await _getIssue(suggestedIssueKey, true, true)
    if (!suggestedIssue) {
      return
    }
    // remove the suggested issue from the current issue list, if present
    this.withIssue(suggestedIssueKey, issue => {
      this.issues.list.remove(issue)
    })
    // add the suggested issue as the first entry of the issue list
    this.issues.list.unshift(suggestedIssue)
    this.selectIssue(suggestedIssue, false)
    analytics('issuePreselected')
  }

  selectIssue (issue, refresh) {
    this.issues.selected = issue
    issue.onSelected(refresh)
    _onIssueSelected(issue.key)
    analytics('selectIssue')
    this.viewIssueAnalytics(issue)
  }

  deselectIssue () {
    const prevKey = this.issues.selected.key
    this.issues.selected = null
    _onIssueDeselected(prevKey)
    analytics('deselectIssue')
  }

  withIssue (issueKey, fn) {
    if (issueKey && fn) {
      const issue = find(this.issues.list, issue => {
        return issue.key === issueKey
      })
      if (issue) {
        return fn(issue)
      }
    }
  }

  async loadProfile () {
    this.profile = await _loadProfile()
  }

  @computed get truncatedErrorMessage () {
    return truncateWithEllipsis(this.errorMessage, maxErrorMessageLength)
  }

  @computed get errorMessage () {
    return this.error && (this.error.message || this.error.name)
  }

  async moreInfo () {
    if (this.error && this.error.faqTopic) {
      _openFaqPage(this.error.faqTopic)
      analytics(`openFaq_${this.error.faqTopic}`)
    }
  }

  @computed get settings () {
    return [{
      id: 'switch-site',
      label: 'Switch Jira Cloud site',
      select: () => {
        analytics('switchJira')
        _reauthorize()
      }
    }, {
      id: 'feedback',
      label: 'Feedback',
      select: () => {
        analytics('feedback')
        _feedback()
      }
    }]
  }

  registerGlobalErrorHandler () {
    addGlobalErrorHandler((error, retry) => {
      this.error = error
      analytics(`issuesError_${error.name}`)
      if (error.name === 'AuthorizationError') {
        this.reauthorize = () => {
          _reauthorize()
        }
      } else {
        this.retry = () => {
          this.error = this.retry = null
          analytics('clickErrorRetry')
          retry()
        }
      }
      // indicate that this error handler will facilitate retries
      return true
    })
  }

  viewIssueAnalytics (issue) {
    let assigneeEventName
    if (this.profile) {
      if (!issue.assignee) {
        assigneeEventName = 'viewIssueAssignedToNobody'
      } else if (issue.assignee.key === this.profile.key) {
        assigneeEventName = 'viewIssueAssignedToUser'
      } else {
        assigneeEventName = 'viewIssueAssignedToOther'
      }
    } else {
      assigneeEventName = 'viewIssueBeforeProfileLoaded'
    }
    let statusCategory = issue.status ? issue.status.statusCategory.key : 'null'
    analyticsBatch([
      {
        name: 'viewIssueDetails',
        properties: {
          keyLength: issue.key.length,
          summaryLength: issue.summary.length,
          attachmentCount: issue.attachments.length
        }
      }, {
        name: `viewIssueStatusCategory_${statusCategory}`
      }, {
        name: assigneeEventName
      }
    ].concat(issue.attachments.map(attachment => {
      return {
        name: 'viewAttachment',
        properties: {
          mimeType: attachment.mimeType,
          thumbnail: attachment.thumbnail && true,
          size: attachment.size
        }
      }
    })))
  }
}

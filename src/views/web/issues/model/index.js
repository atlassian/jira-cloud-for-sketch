import { observable } from 'mobx'
import bindWindowEvents from './bind-window-events'
import pluginCall from 'sketch-module-web-view/client'
import { find, findIndex } from 'lodash'
import bridgedFunctionCall from '../../../bridge/client'
import { analytics } from './util'
import { FiltersMapper, IssuesMapper } from './mapper'

const _loadFilters = bridgedFunctionCall('loadFilters', FiltersMapper)
const _loadIssuesForFilter = bridgedFunctionCall('loadIssuesForFilter', IssuesMapper)

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

  constructor () {
    this.unbindWindowEvents = bindWindowEvents(this)
    this.init()
  }

  init () {
    this.loadFilters()
    this.loadProfile()
  }

  dispose () {
    this.unbindWindowEvents()
  }

  /**
   * @param {string} issueKey
   * @return {Issue}
   */
  findIssueByKey (issueKey) {
    return find(this.issues.list, issue => { return issue.key == issueKey })
  }

  /**
   * @param {string} issueKey
   * @param {function} fn
   */
  withIssue (issueKey, fn) {
    const issue = this.findIssueByKey(issueKey)
    issue && fn(issue)
  }

  findAttachmentById (issueKey, attachmentId) {
    const issue = this.findIssueByKey(issueKey)
    if (issue) {
      return find(issue.attachments, attachment => {
        return attachment.id == attachmentId
      })
    }
  }

  withAttachment (issueKey, attachmentId, fn) {
    const attachment = this.findAttachmentById(issueKey, attachmentId)
    attachment && fn(attachment)
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

  onIssuesLoaded (issues) {
    this.issues.loading = false
    this.issues.list.replace(issues)
  }

  selectIssue (issue) {
    this.issues.selected = issue
    issue.onSelected()
  }

  deselectIssue () {
    this.issues.selected = null
    analytics('backToViewIssueList')
  }

  onThumbnailLoaded (issueKey, attachmentId, dataUri) {
    this.withAttachment(issueKey, attachmentId, attachment => {
      attachment.thumbnailDataUri = dataUri
    })
  }

  onUploadsQueued (issueKey, attachments, replacedAttachmentId) {
    this.withIssue(issueKey, issue => {
      issue.onUploadsQueued(attachments, replacedAttachmentId)
    })
  }

  onUploadProgress (issueKey, attachmentId, progress) {
    this.withAttachment(issueKey, attachmentId, attachment => {
      attachment.progress = progress
    })
  }

  onUploadComplete (issueKey, attachment, oldId) {
    this.withIssue(issueKey, issue => {
      issue.onUploadComplete(attachment, oldId)
    })
  }

  onDeleteComplete (issueKey, attachmentId) {
    this.withIssue(issueKey, issue => {
      issue.attachments.splice(
        findIndex(issue.attachments, attachment => {
          return attachment.id === attachmentId
        }), 1
      )
    })
  }

  onCommentAdded (issueKey, href) {
    this.withIssue(issueKey, issue => {
      issue.onCommentAdded(href)
    })
  }

  loadProfile () {
    pluginCall('loadProfile')
  }

  onProfileLoaded (profile) {
    this.profile = profile
  }
}

import { observable } from 'mobx'
import bindWindowEvents from './bind-window-events'
import pluginCall from 'sketch-module-web-view/client'
import { find } from 'lodash'

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

  findIssueByKey (issueKey) {
    return find(this.issues.list, issue => { return issue.key == issueKey })
  }

  findAttachmentById (issueKey, attachmentId) {
    return find(this.findIssueByKey(issueKey).attachments, attachment => {
      return attachment.id == attachmentId
    })
  }

  loadFilters () {
    this.filters.loading = true
    this.filters.list.clear()
    pluginCall('loadFilters')
  }

  onFiltersLoaded (filters) {
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

  loadIssues () {
    if (this.filters.selected) {
      this.issues.loading = true
      this.issues.list.clear()
      pluginCall('loadIssuesForFilter', this.filters.selected.key)
    }
  }

  onIssuesLoaded (issues) {
    this.issues.loading = false
    this.issues.list.replace(issues)
  }

  selectIssue (issueKey) {
    this.issues.selected = find(
      this.issues.list,
      issue => issue.key === issueKey
    )
    pluginCall('reloadAttachments', issueKey)
    analytics('viewIssue')
  }

  deselectIssue () {
    this.issues.selected = null
    analytics('backToViewIssueList')
  }

  onAttachmentsLoaded (issueKey, newAttachments) {
    const issue = this.findIssueByKey(issueKey)
    if (issue) {
      // re-use existing thumbnails if present
      newAttachments.forEach(newAttachment => {
        const matchingAttachment = find(issue.attachments, attachment => {
          return attachment.id == newAttachment.id
        })
        if (matchingAttachment && matchingAttachment.thumbnailDataUri) {
          newAttachment.thumbnailDataUri = matchingAttachment.thumbnailDataUri
        }
      })
      issue.attachments.replace(newAttachments)
    }
  }

  onThumbnailLoaded (issueKey, attachmentId, dataUri) {
    const attachment = this.findAttachmentById(issueKey, attachmentId)
    if (attachment) {
      attachment.thumbnailDataUri = dataUri
    }
  }

  onCommentAdded (issueKey, href) {
    this.findIssueByKey(issueKey).onCommentAdded(href)
  }

  loadProfile () {
    pluginCall('loadProfile')
  }

  onProfileLoaded (profile) {
    this.profile = profile
  }
}

async function analytics (event, properties) {
  pluginCall('analytics', event, properties)
}

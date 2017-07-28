import { observable } from 'mobx'
import bindWindowEvents from './bind-window-events'
import pluginCall from 'sketch-module-web-view/client'
import { find, findIndex } from 'lodash'
import bridgedFunctionCall from '../../../bridge/client'
import Filter from './Filter'

const _loadFilters = bridgedFunctionCall('loadFilters')

const bridge = {
  loadFilters: async () => {
    return (await _loadFilters()).map(filter => new Filter(filter))
  }
}

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
    const filters = await bridge.loadFilters()
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
    this.withIssue(issueKey, issue => {
      this.issues.selected = issue
      pluginCall('touchIssueAndReloadAttachments', issueKey)
      analytics('viewIssue')
    })
  }

  deselectIssue () {
    this.issues.selected = null
    analytics('backToViewIssueList')
  }

  onAttachmentsLoaded (issueKey, newAttachments) {
    this.withIssue(issueKey, issue => {
      // re-use existing thumbnails if present
      newAttachments.forEach(newAttachment => {
        const matchingAttachment = find(issue.attachments, attachment => {
          return attachment.id == newAttachment.id
        })
        if (matchingAttachment && matchingAttachment.thumbnailDataUri) {
          newAttachment.thumbnailDataUri = matchingAttachment.thumbnailDataUri
        }
      })
      issue.attachments.replace(
        // retain attachments that are currently uploading
        issue.attachments.filter(attachment => {
          return attachment.uploading
        }).concat(newAttachments)
      )
    })
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

  onDownloadProgress (issueKey, attachmentId, progress) {
    this.withAttachment(issueKey, attachmentId, attachment => {
      attachment.progress = progress
    })
  }

  onDownloadComplete (issueKey, attachmentId) {
    this.withAttachment(issueKey, attachmentId, attachment => {
      attachment.downloading = false
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

async function analytics (event, properties) {
  pluginCall('analytics', event, properties)
}

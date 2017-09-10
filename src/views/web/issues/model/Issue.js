import { observable, computed, reaction } from 'mobx'
import { assign, concat, partition, omit, filter, includes, differenceBy, intersectionBy } from 'lodash'
import { bridgedFunction } from '../../../bridge/client'
import { IssueMapper, AttachmentsMapper, AttachmentMapper } from './mapper'
import CommentEditor from './CommentEditor'
import { analytics } from '../../util'

const _getIssue = bridgedFunction('getIssue', IssueMapper)
const _getDroppedFiles = bridgedFunction('getDroppedFiles', AttachmentsMapper)
const _openInBrowser = bridgedFunction('openInBrowser')
const _promptKeepOrReplace = bridgedFunction('promptKeepOrReplace')
const _exportSelectedLayers = bridgedFunction('exportSelectedLayers')

export default class Issue {
  @observable attachments = []
  @observable type = null
  @observable summary = null
  @observable assignee = null
  @observable reporter = null
  @observable status = null

  constructor (issue, attachments) {
    assign(this, issue)
    this.attachments.replace(attachments)
    this.commentEditor = new CommentEditor(this)

    // There's a small race condition where duplicate attachments may appear
    // if the user deselects then reselects an issue while an upload is in
    // progress (JIRA may return the attachment as part of the issue payload
    // before our upload request completes). This autorun function cleans up
    // any dupes for us, before they're displayed to the user.
    reaction(
      () => this.attachments.map(attachment => attachment.id),
      (ids) => {
        // based on the awesome https://stackoverflow.com/a/31681942
        filter(ids, (value, i) => includes(ids, value, i + 1))
        .forEach(duplicateId => {
          this.attachments.remove(
            this.attachments.find(a => a.id === duplicateId)
          )
        })
      }
    )
  }

  async onSelected (refresh) {
    this.loadThumbnails()
    if (refresh) {
      const issue = await _getIssue(this.key, true)
      this.updateIssueFields(issue)
      this.updateAttachments(issue)
      this.commentEditor.onIssueUpdated(issue)
    }
  }

  updateIssueFields (issue) {
    assign(this, omit(issue, 'attachments'))
  }

  /**
   * Map JIRA statusCategory keys to @atlaskit/lozenge appearances.
   */
  @computed get statusAppearance () {
    if (!this.status) {
      return 'default'
    }
    switch (this.status.statusCategory.key) {
      case 'new':
        return 'new'
      case 'indeterminate':
        return 'inprogress'
      case 'done':
        return 'success'
      case 'undefined':
      default:
        return 'default'
    }
  }

  /**
   * Updating attachments is a bit complicated, since some may be uploading
   * (and not yet on the server) or in the middle of a download or delete.
   * Here we add any new attachments, remove any deleted attachments, and
   * retain any that are currently uploading.
   */
  async updateAttachments (issue) {
    const [uploading, existingAttachments] = partition(
      this.attachments.slice(), 'uploading'
    )
    const newAttachments = differenceBy(issue.attachments.slice(), existingAttachments, 'id')
    const retainedAttachments = intersectionBy(existingAttachments, issue.attachments.slice(), 'id')
    this.attachments.replace(concat(uploading, newAttachments, retainedAttachments))
    newAttachments.forEach(a => a.loadThumbnail())
  }

  async loadThumbnails () {
    this.attachments.forEach(attachment => {
      if (!attachment.uploading) {
        attachment.loadThumbnail()
      }
    })
  }

  async uploadDroppedFiles (replacedAttachment) {
    const droppedFiles = await _getDroppedFiles()
    let insertAt = 0
    if (replacedAttachment) {
      insertAt = Math.max(0, this.attachments.indexOf(replacedAttachment))
      replacedAttachment.delete(true)
    }
    droppedFiles.forEach(file => {
      file.upload(this.key)
      this.attachments.splice(insertAt, 0, file)
    })

    // analytics
    if (droppedFiles.length > 1) {
      analytics(
        replacedAttachment ? 'dragFilesToReplace' : 'dragFilesToAttach',
        { count: droppedFiles.length }
      )
    } else {
      analytics(
        replacedAttachment ? 'dragFileToReplace' : 'dragFileToAttach'
      )
    }
  }

  async exportSelectedLayers () {
    _exportSelectedLayers()
  }

  async uploadExportedSelection (files) {
    this.keepOrReplaceMatchingAttachments(files)
    files.map(AttachmentMapper).forEach(attachment => {
      attachment.upload(this.key)
      this.attachments.splice(0, 0, attachment)
    })
  }

  async keepOrReplaceMatchingAttachments (files) {
    const attachments = this.attachments.slice().filter(
      // don't replace attachments that are uploading or deleting
      attachment => { return !(attachment.uploading || attachment.deleting) }
    )
    const matching = intersectionBy(attachments, files, 'filename')
    if (matching.length > 0) {
      const choice = await _promptKeepOrReplace(
        this.key,
        matching.map(file => file.filename)
      )
      const replace = choice === 'replace'
      if (replace) {
        matching.forEach(attachment => attachment.delete(true))
      }

      // analytics
      if (matching.length > 1) {
        analytics(
          replace ? 'replaceDuplicates' : 'keepDuplicates',
          { count: matching.length }
        )
      } else {
        analytics(
          replace ? 'replaceDuplicate' : 'keepDuplicate'
        )
      }
    }
  }

  @computed get browseUrl () {
    var baseUrl = this.self.substring(0, this.self.indexOf('/rest/'))
    return `${baseUrl}/browse/${this.key}`
  }

  openInBrowser () {
    _openInBrowser(this.browseUrl)
    analytics('openIssueInBrowser')
  }
}

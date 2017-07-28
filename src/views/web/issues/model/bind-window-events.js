import { forOwn } from 'lodash'
import Filter from './Filter'
import Issue from './Issue'
import Attachment from './Attachment'
import Profile from './Profile'

export default function (viewModel) {
  const events = {
    'jira.filters.loaded': event => {
      viewModel.onFiltersLoaded(event.detail.filters.map(filter => new Filter(filter)))
    },
    'jira.issues.loaded': event => {
      viewModel.onIssuesLoaded(event.detail.issues.map(issue => {
        const attachments = issue.attachments.map(attachment => new Attachment(issue.key, attachment))
        delete issue.attachments
        return new Issue(issue, attachments)
      }))
    },
    'jira.attachments.loaded': event => {
      const { issueKey, attachments } = event.detail
      viewModel.onAttachmentsLoaded(
        issueKey,
        attachments.map(attachment => new Attachment(issueKey, attachment))
      )
    },
    'jira.thumbnail.loaded': event => {
      const { issueKey, id, dataUri } = event.detail
      viewModel.onThumbnailLoaded(issueKey, id, dataUri)
    },
    'jira.profile.loaded': event => {
      viewModel.onProfileLoaded(new Profile(event.detail.profile))
    },
    'jira.comment.added': event => {
      const { issueKey, href } = event.detail
      viewModel.onCommentAdded(issueKey, href)
    },
    'jira.upload.queued': event => {
      const { issueKey, attachments, replacedAttachmentId } = event.detail
      viewModel.onUploadsQueued(
        issueKey,
        attachments.map(attachment => new Attachment(issueKey, attachment)),
        replacedAttachmentId
      )
    },
    'jira.upload.progress': event => {
      const { issueKey, attachmentId, progress } = event.detail
      viewModel.onUploadProgress(issueKey, attachmentId, progress)
    },
    'jira.upload.complete': event => {
      const { issueKey, oldId, attachment } = event.detail
      viewModel.onUploadComplete(issueKey, new Attachment(issueKey, attachment), oldId)
    },
    'jira.download.progress': event => {
      const { issueKey, attachmentId, progress } = event.detail
      viewModel.onDownloadProgress(issueKey, attachmentId, progress)
    },
    'jira.download.complete': event => {
      const { issueKey, attachmentId } = event.detail
      viewModel.onDownloadComplete(issueKey, attachmentId)
    },
    'jira.delete.complete': event => {
      const { issueKey, attachmentId } = event.detail
      viewModel.onDeleteComplete(issueKey, attachmentId)
    }
  }
  forOwn(events, (func, key) => window.addEventListener(key, func))
  return function () {
    forOwn(events, (func, key) => window.removeEventListener(key, func))
  }
}

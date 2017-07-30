import { forOwn } from 'lodash'
import Attachment from './Attachment'
import Profile from './Profile'

export default function (viewModel) {
  const events = {
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

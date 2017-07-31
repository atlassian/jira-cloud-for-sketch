import createWebUI from './webui-common'
import Filters from './helpers/filters'
import Uploads from './helpers/uploads'
import Attachments from './helpers/attachments'
import Comments from './helpers/comments'
import Profile from './helpers/profile'
import analytics from '../../analytics'
import { OFFLINE_DEV } from '../../config'
const JIRA = require(OFFLINE_DEV ? '../../mock-jira' : '../../jira')

export default function (context) {
  const webUI = createWebUI(context, {
    name: 'issues',
    width: 510,
    height: 382,
    handlers: {
      async loadFilters () {
        return filters.loadFilters()
      },
      loadProfile () {
        return profile.loadProfile()
      },
      loadIssuesForFilter (filterKey) {
        return filters.onFilterChanged(filterKey)
      },
      getDroppedFiles () {
        return uploads.getDroppedFiles()
      },
      uploadAttachment (issueKey, attachment, progress) {
        return uploads.uploadAttachment(issueKey, attachment, progress)
      },
      touchIssueAndReloadAttachments (issueKey) {
        return attachments.touchIssueAndReloadAttachments(issueKey)
      },
      getThumbnail (url, mimeType) {
        return attachments.getThumbnail(url, mimeType)
      },
      openAttachment (url, filename, progress) {
        return attachments.openAttachment(url, filename, progress)
      },
      deleteAttachment (id) {
        return attachments.deleteAttachment(id)
      },
      addComment (issueKey, comment) {
        return comments.addComment(issueKey, comment)
      }
    }
  })

  var jira = new JIRA()
  var filters = new Filters(context, webUI, jira)
  var attachments = new Attachments(context, webUI, jira)
  var uploads = new Uploads(context, webUI, jira, attachments)
  var comments = new Comments(context, webUI, jira)
  var profile = new Profile(context, webUI, jira)

  analytics.viewIssueListPanelOpen()

  return webUI
}

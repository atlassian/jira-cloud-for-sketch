import '../../defaultImports'
import createWebUI from '../../webui-common'
import { executeSafelyAsync } from '../../util'
import { isAuthorized } from '../../auth'
import Connect from '../connect'
import Filters from './filters'
import Uploads from './uploads'
import Attachments from './attachments'
import Comments from './comments'
import Profile from './profile'
import analytics from '../../analytics'
import { OFFLINE_DEV } from '../../config'
const JIRA = require(OFFLINE_DEV ? '../../mock-jira' : '../../jira')

export default async function (context) {
  executeSafelyAsync(context, async function () {
    if (!OFFLINE_DEV && !isAuthorized()) {
      analytics.viewIssueListPanelOpenNotConnected()
      return Connect(context)
    }

    const webUI = createWebUI(context, {
      name: 'issues',
      height: 382,
      width: 510,
      handlers: {
        onReady () {
          filters.onReady()
          profile.onReady()
        },
        filterSelected (filterKey) {
          filters.onFilterChanged(filterKey)
        },
        uploadDroppedFiles (issueKey) {
          uploads.onFilesDropped(issueKey)
        },
        reloadAttachments (issueKey) {
          attachments.reloadAttachments(issueKey)
        },
        openAttachment (issueKey, url, filename) {
          attachments.openAttachment(issueKey, url, filename)
        },
        deleteAttachment (issueKey, id) {
          attachments.deleteAttachment(issueKey, id)
          analytics.viewIssueAttachmentDelete()
        },
        replaceAttachment (issueKey, id) {
          executeSafelyAsync(context, async function () {
            await uploads.onFilesDropped(issueKey)
            attachments.deleteAttachment(issueKey, id)
            analytics.viewIssueAttachmentReplace()
          })
        },
        addComment (issueKey, comment) {
          comments.addComment(issueKey, comment)
        }
      }
    })

    var jira = new JIRA()
    var filters = new Filters(context, webUI, jira)
    var uploads = new Uploads(context, webUI, jira)
    var attachments = new Attachments(context, webUI, jira)
    var comments = new Comments(context, webUI, jira)
    var profile = new Profile(context, webUI, jira)

    analytics.viewIssueListPanelOpen()
  })
}

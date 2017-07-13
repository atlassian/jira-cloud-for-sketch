import '../../defaultImports'
import createWebUI from '../../webui-common'
import { executeSafelyAsync } from '../../util'
import { isAuthorized } from '../../auth'
import Connect from '../connect'
import Filters from './filters'
import Uploads from './uploads'
import Attachments from './attachments'
import Comments from './comments'
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
      background: MSImmutableColor.colorWithSVGString(
        '#e7e7e7'
      ).NSColorWithColorSpace(null),
      height: 335,
      width: 450,
      handlers: {
        onReady () {
          filters.onReady()
        },
        filterSelected (filterKey) {
          filters.onFilterChanged(filterKey)
        },
        uploadDroppedFiles (issueKey) {
          uploads.onFilesDropped(issueKey)
        },
        loadAttachments (issueKey) {
          attachments.loadAttachments(issueKey)
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

    analytics.viewIssueListPanelOpen()
  })
}

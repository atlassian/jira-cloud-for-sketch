import '../../defaultImports'
import jiraWebUI from '../../jira-webui'
import { executeSafely, executeSafelyAsync, openInBrowser, openInDefaultApp } from '../../util'
import { isAuthorized } from '../../auth'
import Connect from '../connect'
import Filters from './filters'
import Uploads from './uploads'
import Attachments from './attachments'
import { OFFLINE_DEV } from '../../config'
const JIRA = require(OFFLINE_DEV ? '../../mock-jira' : '../../jira')

export default async function (context) {
  executeSafelyAsync(context, async function () {
    if (!OFFLINE_DEV && !isAuthorized()) {
      return Connect(context)
    }

    const webUI = jiraWebUI(context, {
      name: 'issues',
      background: MSImmutableColor.colorWithSVGString(
        '#e7e7e7'
      ).NSColorWithColorSpace(null),
      height: 325,
      width: 450,
      handlers: {
        onReady () {
          filters.onReady()
        },
        filterSelected (filterKey) {
          filters.onFilterChanged(filterKey)
        },
        loadAttachments (issueKey) {
          attachments.loadAttachments(issueKey)
        },
        uploadDroppedFiles (issueKey) {
          uploads.onFilesDropped(issueKey)
        },
        openInBrowser (url) {
          executeSafely(context, function () {
            openInBrowser(url)
          })
        },
        openAttachment (url, filename) {
          executeSafelyAsync(context, async function () {
            context.document.showMessage(`Downloading ${filename}...`)
            const filepath = await jira.downloadAttachment(url, filename)
            context.document.showMessage(`Saved as ${filepath}`)
            openInDefaultApp(filepath)
          })
        }
      }
    })

    var jira = new JIRA()
    var filters = new Filters(context, webUI, jira)
    var uploads = new Uploads(context, webUI, jira)
    var attachments = new Attachments(context, webUI, jira)
  })
}

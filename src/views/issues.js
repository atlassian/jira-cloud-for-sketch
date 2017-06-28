import '../defaultImports'
import jiraWebUI from '../jira-webui'
import { executeSafely, executeSafelyAsync, openInBrowser } from '../util'
import { isAuthorized, getBearerToken, getJiraHost } from '../auth'
import JIRA from '../jira'
import Connect from './connect'
import { OFFLINE_DEV } from '../config'
import DragUIDelegate from '../dragndrop-uidelegate'

export default function (context) {
  executeSafelyAsync(context, async function () {
    if (!OFFLINE_DEV && !isAuthorized()) {
      return Connect(context)
    }
    var filesToUpload = []
    const webUI = jiraWebUI(context, {
      name: 'issues',
      background: MSImmutableColor.colorWithSVGString(
        '#e7e7e7'
      ).NSColorWithColorSpace(null),
      height: 320,
      width: 450,
      handlers: {
        openInBrowser (url) {
          executeSafely(context, function () {
            openInBrowser(url)
          })
        },
        uploadDroppedFiles (key) {
          executeSafely(context, function () {
            var noun = filesToUpload.length == 1 ? 'attachment' : 'attachments'
            context.document.showMessage(
              `Uploading ${filesToUpload.length} ${noun} to ${key}`
            )
          })
        }
      }
    })
    var uiDelegate = DragUIDelegate(context, function (draggedFiles) {
      console.log('Dragged files')
      console.log(draggedFiles)
      filesToUpload = draggedFiles
    })
    webUI.webView.setUIDelegate_(uiDelegate.new())
    var recentIssues
    if (OFFLINE_DEV) {
      recentIssues = require('../mock-issues.json')
    } else {
      const jiraHost = getJiraHost()
      const token = await getBearerToken()
      const jira = new JIRA(jiraHost, token)
      recentIssues = await jira.getRecentIssues()
    }
    webUI.eval(`window.issues=${JSON.stringify(recentIssues.issues)}`)
    webUI.eval('window.ready=true')
  })
}

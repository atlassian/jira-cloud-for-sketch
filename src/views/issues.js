import '../defaultImports'
import WebUI from 'sketch-module-web-view'
import { executeSafely, executeSafelyAsync, openInBrowser } from '../util'
import { isAuthorized, getBearerToken, getJiraHost } from '../auth'
import JIRA from '../jira'
import Connect from './connect'

export default function (context) {
  executeSafelyAsync(context, async function () {
    if (!isAuthorized()) {
      return Connect(context)
    }
    const jiraHost = getJiraHost()
    const token = await getBearerToken()
    const jira = new JIRA(jiraHost, token)
    const recentIssues = await jira.getRecentIssues()

    const webUI = new WebUI(context, 'issues.html', {
      identifier: 'jira-sketch-plugin.issues',
      height: 280,
      width: 600,
      onlyShowCloseButton: true,
      hideTitleBar: false,
      title: 'Recent Issues',
      handlers: {
        openInBrowser (url) {
          executeSafely(context, function () {
            openInBrowser(url)
          })
        },
        viewIssue (key) {
          executeSafely(context, function () {
            var app = NSApp.delegate()
            app.refreshCurrentDocument()
            webUI.panel.close()
            context.document.showMessage(`Viewing issue '${key}'`)
          })
        },
        exportAssets (key) {
          executeSafely(context, function () {
            var app = NSApp.delegate()
            app.refreshCurrentDocument()
            webUI.panel.close()
            context.document.showMessage(`Exported assets to '${key}'`)
          })
        }
      }
    })
    webUI.eval(`window.issues=${JSON.stringify(recentIssues.issues)}`)
    webUI.eval('window.ready=true')
  })
}

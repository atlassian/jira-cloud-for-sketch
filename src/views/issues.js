import WebUI from 'sketch-module-web-view'
import { executeSafely, executeSafelyAsync } from '../util'
import { getBearerToken, getJiraHost } from '../auth'
import JIRA from '../jira'

export default function (context) {
  executeSafelyAsync(context, async function() {

    const token = await getBearerToken()
    const jiraHost = getJiraHost()
    const jira = new JIRA(jiraHost, token)

    const recentIssues = await jira.getRecentIssues()

    const webUI = new WebUI(context, 'issues.html', {
      identifier: 'jira-sketch-plugin.issues',
      height: 280,
      width: 600,
      onlyShowCloseButton: true,
      hideTitleBar: false,
      title: "Recent Issues",
      handlers: {
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
    webUI.eval('window.issues=' + JSON.stringify(recentIssues.issues));
    webUI.eval('window.ready=true')
  })
}

import '../defaultImports'
import WebUI from 'sketch-module-web-view'
import { executeSafely, executeSafelyAsync } from '../util'
import { authorizeSketchForJira } from '../auth'

export default function (context) {
  executeSafely(context, function () {
    const webUI = new WebUI(context, 'connect.html', {
      identifier: 'jira-sketch-plugin.connect',
      height: 240,
      width: 400,
      onlyShowCloseButton: true,
      hideTitleBar: false,
      title: 'Connect to JIRA Cloud',
      handlers: {
        connectToJira (jiraUrl) {
          executeSafelyAsync(context, async function () {
            webUI.panel.close()
            await authorizeSketchForJira(context, jiraUrl)
          })
        },
        cancel () {
          executeSafely(context, function () {
            webUI.panel.close()
          })
        }
      }
    })
  })
}

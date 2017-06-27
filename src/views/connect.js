import '../defaultImports'
import { executeSafely, executeSafelyAsync } from '../util'
import { authorizeSketchForJira } from '../auth'
import jiraWebUI from '../jira-webui'

export default function (context) {
  executeSafely(context, function () {
    const webUI = jiraWebUI(context, {
      name: 'connect',
      height: 320,
      width: 340,
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

import createWebUI from '../../webui-common'
import { executeSafely, executeSafelyAsync } from '../../util'
import { authorizeSketchForJira } from '../../auth'
import analytics from '../../analytics'

export default function (context) {
  const webUI = createWebUI(context, {
    name: 'connect',
    height: 320,
    width: 340,
    handlers: {
      connectToJira (jiraUrl) {
        executeSafelyAsync(context, async function () {
          webUI.panel.close()
          await authorizeSketchForJira(context, jiraUrl)
          analytics.jiraConnectInitiateDance()
        })
      },
      cancel () {
        executeSafely(context, function () {
          webUI.panel.close()
        })
      }
    }
  })
  analytics.jiraConnectPanelOpen()
  return webUI
}

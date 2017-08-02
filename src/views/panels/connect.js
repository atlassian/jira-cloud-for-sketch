import createWebUI from './webui-common'
import { executeSafely, executeSafelyAsync } from '../../util'
import { authorizeSketchForJira } from '../../auth'
import analytics from '../../analytics'
import { akGridSizeUnitless } from '@atlaskit/util-shared-styles'
import { titlebarHeight } from './ui-constants'

export default function (context) {
  const webUI = createWebUI(context, {
    name: 'connect',
    width: 44 * akGridSizeUnitless,
    height: titlebarHeight + 40 * akGridSizeUnitless + 2,
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

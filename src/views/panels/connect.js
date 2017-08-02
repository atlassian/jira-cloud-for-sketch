import createWebUI from './webui-common'
import { authorizeSketchForJira, awaitAuthorization, testAuthorization } from '../../auth'
import analytics from '../../analytics'
import { akGridSizeUnitless } from '@atlaskit/util-shared-styles'
import { titlebarHeight } from './ui-constants'
import openIssuesPanel from './issues'

export default function (context) {
  const webUI = createWebUI(context, {
    name: 'connect',
    width: 44 * akGridSizeUnitless,
    height: titlebarHeight + 40 * akGridSizeUnitless + 2, // fudge
    handlers: {
      async connectOrGetAuthUrl (jiraUrl) {
        analytics.jiraConnectInitiateDance()
        const authUrl = await authorizeSketchForJira(context, jiraUrl)
        if (await testAuthorization()) {
          // the user has already authorized this instance
          connectionSucessful()
        } else {
          // the user must authorize Sketch via JIRA
          return authUrl
        }
      },
      async awaitAuthorization () {
        await awaitAuthorization()
        connectionSucessful()
      }
    }
  })
  analytics.jiraConnectPanelOpen()

  function connectionSucessful () {
    webUI.panel.close()
    openIssuesPanel(context)
  }

  return webUI
}

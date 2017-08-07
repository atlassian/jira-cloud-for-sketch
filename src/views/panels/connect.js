import createWebUI from './webui-common'
import { setJiraUrl, getAuthorizationUrl, awaitAuthorization, testAuthorization } from '../../auth'
import analytics from '../../analytics'
import { akGridSizeUnitless } from '@atlaskit/util-shared-styles'
import { titlebarHeight } from './ui-constants'
import openIssuesPanel from './issues'

export default function (context) {
  const webUI = createWebUI(context, {
    name: 'connect',
    width: 44 * akGridSizeUnitless,
    // +2 == fudge (lineheights don't quite add up to a multiple of akGridSize)
    height: titlebarHeight + 40 * akGridSizeUnitless + 2,
    handlers: {
      async setJiraUrl (jiraUrl) {
        return setJiraUrl(jiraUrl)
      },
      async testAuthorization () {
        return testAuthorization()
      },
      async getAuthorizationUrl () {
        return getAuthorizationUrl()
      },
      async awaitAuthorization () {
        return awaitAuthorization()
      },
      async authorizationComplete () {
        webUI.panel.close()
        openIssuesPanel(context)
      }
    }
  })
  analytics.jiraConnectPanelOpen()

  return webUI
}

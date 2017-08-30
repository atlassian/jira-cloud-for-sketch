import { createWebUI, ConnectPanelId } from './webui-common'
import {
  setJiraUrl,
  getJiraHost,
  isJiraHostSet,
  getAuthorizationUrl,
  awaitAuthorization,
  testAuthorization
} from '../../auth'
import analytics from '../../analytics'
import { akGridSizeUnitless } from '@atlaskit/util-shared-styles'
import { titlebarHeight } from './ui-constants'
import openIssuesPanel from './issues'
import { trace } from '../../logger'

/**
 * Spawns the 'Connect' panel for authorizing the user with JIRA.
 *
 * @param {Object} context provided by Sketch
 * @return {Object} a WebUI for the launched panel
 */
export default function (context) {
  const webUI = createWebUI(context, ConnectPanelId, 'connect.html', {
    width: 44 * akGridSizeUnitless,
    // +2 == fudge (lineheights don't quite add up to a multiple of akGridSize)
    height: titlebarHeight + 40 * akGridSizeUnitless + 2,
    handlers: {
      async getJiraUrl () {
        if (isJiraHostSet()) {
          trace(`jira host is ${getJiraHost()}`)
          return getJiraHost()
        } else {
          trace(`jira host is not set`)
          return ''
        }
      },
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

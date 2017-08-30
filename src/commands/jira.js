import '../default-imports'
import { executeSafelyAsync } from '../util'
import { isAuthorized } from '../auth'
import analytics from '../analytics'
import connectPanel from '../views/panels/connect'
import issuesPanel from '../views/panels/issues'
import { closeAllPluginPanels } from '../views/panels/webui-common'

/**
 * If the user isn't already authorized, opens the Connect panel to start the
 * authorization process with JIRA. Otherwise opens the JIRA panel.
 * @param {Object} context provided by Sketch
 */
export default async function (context) {
  COScript.currentCOScript().setShouldKeepAround(true)
  executeSafelyAsync(context, async function () {
    closeAllPluginPanels()
    if (isAuthorized()) {
      issuesPanel(context)
    } else {
      analytics.viewIssueListPanelOpenNotConnected()
      connectPanel(context)
    }
  })
}

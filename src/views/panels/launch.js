import { executeSafelyAsync } from '../../util'
import { isAuthorized } from '../../auth'
import connectPanel from './connect'
import issuesPanel from './issues'
import { closeAllPluginPanels } from './webui-common'

/**
 * If the user isn't already authorized, opens the Connect panel to start the
 * authorization process with Jira. Otherwise opens the Jira panel.
 *
 * @param {Object} context provided by Sketch
 */
export default async function (context) {
  executeSafelyAsync(context, async function () {
    closeAllPluginPanels()
    if (isAuthorized()) {
      issuesPanel(context)
    } else {
      connectPanel(context)
    }
  })
}

import '../default-imports'
import { executeSafelyAsync } from '../util'
import { isAuthorized } from '../auth'
import analytics from '../analytics'
import connectPanel from '../views/panels/connect'
import issuesPanel from '../views/panels/issues'
import { closeAllPluginPanels } from '../views/panels/webui-common'

export default async function (context) {
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

import '../default-imports'
import { executeSafelyAsync } from '../util'
import { isAuthorized } from '../auth'
import analytics from '../analytics'
import { OFFLINE_DEV } from '../config'
import connectPanel from '../views/panels/connect'
import issuesPanel from '../views/panels/issues'

export default async function (context) {
  executeSafelyAsync(context, async function () {
    if (isAuthorized() || OFFLINE_DEV) {
      issuesPanel(context)
    } else {
      analytics.viewIssueListPanelOpenNotConnected()
      connectPanel(context)
    }
  })
}

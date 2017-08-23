import '../default-imports'
import { executeSafelyAsync } from '../util'
import { getSelectedIssueKey } from '../plugin-state'
import exportButton from '../views/controls/export-button'

export default async function (context) {
  COScript.currentCOScript().setShouldKeepAround(true)
  executeSafelyAsync(context, function () {
    if (getSelectedIssueKey()) {
      exportButton.add(context)
    } else {
      exportButton.remove(context)
    }
  })
}

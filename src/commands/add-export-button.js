import '../default-imports'
import { executeSafelyAsync } from '../util'
import pluginState, { keys } from '../plugin-state'
import exportButton from '../views/controls/export-button'

export default async function (context) {
  executeSafelyAsync(context, function () {
    if (pluginState[keys.selectedIssue]) {
      exportButton.add(context)
    } else {
      exportButton.remove(context)
    }
  })
}

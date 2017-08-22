import '../default-imports'
import { executeSafelyAsync } from '../util'
import exportButton from '../views/controls/export-button'

export default async function (context) {
  COScript.currentCOScript().setShouldKeepAround(true)
  executeSafelyAsync(context, function () {
    // exportButton.add(context)
  })
}

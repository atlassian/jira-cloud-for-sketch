import '../default-imports'
import { executeSafelyAsync } from '../util'
import { triggerOnSelectionChanged } from '../plugin-state'
import exportButton from '../views/controls/export-button'

/**
 * Adds or removes the export button to Sketch's export panel, based on whether
 * an issue is currently selected. This should be invoked any time the export
 * dialog may appear or disappear, e.g. when the selected layer changes, or a
 * new export option is added.
 *
 * @param {Object} context provided by Sketch
 */
export default async function (context) {
  COScript.currentCOScript().setShouldKeepAround(true)
  executeSafelyAsync(context, function () {
    exportButton.add(context)
    triggerOnSelectionChanged()
  })
}

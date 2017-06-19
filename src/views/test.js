import '../defaultImports'
import { executeSafelyAsync, createFailAlert } from '../util'
import { exportSelected } from '../export'

export default function (context) {
  executeSafelyAsync(context, async function() {

    var exportedPaths = exportSelected(context, "/Users/tpettersen/tmp/sketch-exports/")
    createFailAlert(context, "Exported!", exportedPaths.join("\n"))

  })
}
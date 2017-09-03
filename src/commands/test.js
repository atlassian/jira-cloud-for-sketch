import '../default-imports'
import { executeSafelyAsync } from '../util'
import { trace } from '../logger'

/**
 * An unbound test action used only in development.
 *
 * @param {Object} context provided by Sketch
 */
export default async function (context) {
  executeSafelyAsync(context, async function () {
    var coscript = COScript.currentCOScript()
    coscript.setShouldKeepAround(true)
    trace('Test action')
  })
}

import '../defaultImports'
import { executeSafelyAsync } from '../util'
import { trace } from '../logger'

export default async function (context) {
  executeSafelyAsync(context, async function () {
    var coscript = COScript.currentCOScript()
    coscript.setShouldKeepAround(true)
    trace('Test action')
  })
}

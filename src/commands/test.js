import '../defaultImports'
import { executeSafelyAsync } from '../util'
import { trace } from '../logger'
import download from '../download'

export default async function (context) {
  executeSafelyAsync(context, async function () {
    var coscript = COScript.currentCOScript()
    coscript.setShouldKeepAround(true)
    var file = await download('https://tpettersen.bitbucket.io/sketch.png', {
      filename: 'sketch.png'
    })
    context.document.showMessage(`Downloaded ${file}`)
    coscript.setShouldKeepAround(false)
  })
}

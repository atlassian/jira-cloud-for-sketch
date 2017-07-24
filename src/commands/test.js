import '../defaultImports'
import { executeSafelyAsync } from '../util'
import { trace } from '../logger'
import upload from '../upload'

export default async function (context) {
  executeSafelyAsync(context, async function () {
    var coscript = COScript.currentCOScript()
    coscript.setShouldKeepAround(true)
    for (var i = 0; i < 3; i++) {
      let data = await upload('https://file.io', {
        filePath: '/Users/tpettersen/tmp/erik.jpg',
        progress: function (totalBytesWritten, totalBytesExpectedToWrite) {
          trace(`${totalBytesWritten} of ${totalBytesExpectedToWrite} bytes written`)
        }
      })
      trace(await data.text())
    }
  })
}

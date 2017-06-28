import '../defaultImports'
import { executeSafely } from '../util'

export default function (context) {
  executeSafely(context, function () {
    context.document.showMessage(`Test action`)
  })
}

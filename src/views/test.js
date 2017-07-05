import '../defaultImports'
import { executeSafelyAsync } from '../util'

export default async function (context) {
  await executeSafelyAsync(context, async function () {
    context.document.showMessage(`Test action`)
  })
}

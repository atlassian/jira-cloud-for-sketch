import '../defaultImports'
import { feedbackUrl } from '../config'
import { executeSafely, openInBrowser } from '../util'
import analytics from '../analytics'

export default async function (context) {
  executeSafely(context, async function () {
    openInBrowser(feedbackUrl)
    analytics.feedbackOpenInBrowser()
  })
}

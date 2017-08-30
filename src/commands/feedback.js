import '../default-imports'
import { feedbackUrl } from '../config'
import { executeSafely, openInBrowser } from '../util'
import analytics from '../analytics'

/**
 * Opens the Feedback page in the system browser.
 * @param {Object} context provided by Sketch
 */
export default async function (context) {
  executeSafely(context, async function () {
    openInBrowser(feedbackUrl)
    analytics.feedbackOpenInBrowser()
  })
}

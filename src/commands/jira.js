import '../default-imports'
import launchPanel from '../views/panels/launch'
import { analytics } from '../analytics'

/**
 * The primary command. Launches the authorization panel if the plugin isn't
 * currently connected to a Jira Cloud site, or the Jira panel if it is.
 *
 * @param {Object} context provided by Sketch
 */
export default function (context) {
  COScript.currentCOScript().setShouldKeepAround(true)
  launchPanel(context)
  analytics('openPanelByMenuOrShortcut')
}

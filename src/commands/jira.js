import '../default-imports'
import launchPanel from '../views/panels/launch'

/**
 * The primary command. Launches the authorization panel if the plugin isn't
 * currently connected to a JIRA Cloud site, or the JIRA panel if it is.
 *
 * @param {Object} context provided by Sketch
 */
export default function (context) {
  COScript.currentCOScript().setShouldKeepAround(true)
  launchPanel(context)
}

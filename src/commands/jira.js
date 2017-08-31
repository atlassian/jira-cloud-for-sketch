import '../default-imports'
import launchPanel from '../views/panels/launch'

export default function (context) {
  COScript.currentCOScript().setShouldKeepAround(true)
  launchPanel(context)
}

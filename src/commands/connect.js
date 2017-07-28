import '../default-imports'
import { executeSafely } from '../util'
import connectPanel from '../views/panels/connect'

export default function (context) {
  // TODO should close any other open views before allowing the user to reconnect!
  executeSafely(context, function () {
    connectPanel(context)
  })
}

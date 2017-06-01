import { getBearerToken } from '../auth'
import { executeSafely, createFailAlert } from '../util'

export default function (context) {  
  executeSafely(context, async function() {
      const token = await getBearerToken()
      createFailAlert(context, "bearer", JSON.stringify(token))
  })
}
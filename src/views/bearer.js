import { getBearerToken } from '../auth'
import { executeSafelyAsync, createFailAlert } from '../util'

export default function (context) {  
  console.log('it begins')
  executeSafelyAsync(context, async function() {
      const token = await getBearerToken()
      createFailAlert(context, "bearer", JSON.stringify(token))
  })
}
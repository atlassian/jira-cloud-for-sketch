import { getBearerToken, getJiraHost } from '../auth'
import { executeSafelyAsync, createFailAlert } from '../util'
import JIRA from '../jira'

export default function (context) {  
  executeSafelyAsync(context, async function() {

      const token = await getBearerToken()
      const jiraHost = getJiraHost()
      const jira = new JIRA(jiraHost, token)

      const recentIssues = await jira.getRecentIssues()
      createFailAlert(context, "Recent Issues", JSON.stringify(recentIssues))

  })
}
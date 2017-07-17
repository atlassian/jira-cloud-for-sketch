import '../defaultImports'
import { isAuthorized, getBearerToken, getJiraHost } from '../auth'
import { exportSelected } from '../export'
import JIRA from '../jira'
import { executeSafelyAsync, createFailAlert } from '../util'
import Connect from './connect'

export default function (context) {
  executeSafelyAsync(context, async function () {
    if (!isAuthorized()) {
      return Connect(context)
    }
    if (context.selection.count() == 0) {
      createFailAlert(
        context,
        'Selection required',
        'Please select some artboards or layers to export.'
      )
      return
    }

    const token = await getBearerToken()
    const jiraHost = getJiraHost()
    const jira = new JIRA(jiraHost, token)

    var recentIssues = await jira.getRecentIssues()
    var options = recentIssues.issues.map(
      issue => issue.key + ': ' + issue.fields.summary
    )
    var userResponse = context
      .api()
      .getSelectionFromUser('Export to...', options, 0)

    if (userResponse[0] == NSAlertFirstButtonReturn) {
      var selectedIssue = recentIssues.issues[userResponse[1]]
      var exportedPaths = exportSelected(context)
      for (var i = 0; i < exportedPaths.length; i++) {
        // todo parallelize?
        await jira.uploadAttachment(selectedIssue.key, exportedPaths[i])
      }
      createFailAlert(
        context,
        'Export complete',
        'Attached ' + exportedPaths.length + ' assets to ' + selectedIssue.key
      )
    }
  })
}

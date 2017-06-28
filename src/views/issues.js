import '../defaultImports'
import jiraWebUI from '../jira-webui'
import { executeSafely, executeSafelyAsync, openInBrowser } from '../util'
import { isAuthorized, getBearerToken, getJiraHost } from '../auth'
import JIRA from '../jira'
import Connect from './connect'
import { OFFLINE_DEV } from '../config'
import { getDraggedFiles } from '../pasteboard'

export default function (context) {
  executeSafelyAsync(context, async function () {
    if (!OFFLINE_DEV && !isAuthorized()) {
      return Connect(context)
    }
    var uploadAttachment
    const webUI = jiraWebUI(context, {
      name: 'issues',
      background: MSImmutableColor.colorWithSVGString(
        '#e7e7e7'
      ).NSColorWithColorSpace(null),
      height: 320,
      width: 450,
      handlers: {
        openInBrowser (url) {
          executeSafely(context, function () {
            openInBrowser(url)
          })
        },
        uploadDroppedFiles (issueKey) {
          executeSafely(context, function () {
            var filesToUpload = getDraggedFiles()
            var noun = filesToUpload.length == 1 ? 'attachment' : 'attachments'
            if (OFFLINE_DEV) {
              context.document.showMessage(`Can't upload ${filesToUpload.length} ${noun} to ${issueKey} (offline)`)
            } else {
              context.document.showMessage(`Uploading ${filesToUpload.length} ${noun} to ${issueKey}`)
              for (var i = 0; i < filesToUpload.length; i++) {
                uploadAttachment(issueKey, filesToUpload[i])
              }
              context.document.showMessage(`Uploading to ${issueKey} complete`)
            }
          })
        }
      }
    })
    var recentIssues
    if (OFFLINE_DEV) {
      recentIssues = require('../mock-issues.json')
    } else {
      const jiraHost = getJiraHost()
      const token = await getBearerToken()
      const jira = new JIRA(jiraHost, token)
      recentIssues = await jira.getRecentIssues()
      uploadAttachment = async function (issueKey, filepath) {
        console.log(`Uploading ${filepath} to ${issueKey}`)
        await jira.uploadAttachment(issueKey, filepath)
      }
    }
    webUI.eval(`window.issues=${JSON.stringify(recentIssues.issues)}`)
    webUI.eval('window.ready=true')
  })
}

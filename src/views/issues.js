import '../defaultImports'
import jiraWebUI from '../jira-webui'
import { executeSafely, executeSafelyAsync, openInBrowser, normalizeFilepath } from '../util'
import { isAuthorized, getBearerToken, getJiraHost } from '../auth'
import JIRA from '../jira'
import Connect from './connect'
import { OFFLINE_DEV } from '../config'
import { getDraggedFiles } from '../pasteboard'
import { trace } from '../logger'

export default async function (context) {
  executeSafelyAsync(context, async function () {
    if (!OFFLINE_DEV && !isAuthorized()) {
      return Connect(context)
    }

    var uploadRequests = []

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
            // allowing a handler to run too long seems causes Sketch to crash
            // due to a failing Mocha context. Hence we add these to a queue!
            uploadRequests.push({
              issueKey: issueKey,
              files: getDraggedFiles()
            })
          })
        }
      }
    })

    var jira
    var recentIssues
    if (OFFLINE_DEV) {
      recentIssues = require('../mock-issues.json')
    } else {
      const jiraHost = getJiraHost()
      const token = await getBearerToken()
      jira = new JIRA(jiraHost, token)
      recentIssues = await jira.getRecentIssues()
    }
    webUI.eval(`window.issues=${JSON.stringify(recentIssues.issues)}`)
    webUI.eval('window.ready=true')

    async function processUploadRequests () {
      if (uploadRequests.length > 0) {
        var uploadRequest = uploadRequests.pop()
        var issueKey = uploadRequest.issueKey
        var files = uploadRequest.files
        var noun = files.length == 1 ? 'attachment' : 'attachments'
        if (OFFLINE_DEV) {
          context.document.showMessage(`Can't upload ${files.length} ${noun} to ${issueKey} (offline)`)
        } else {
          for (var i = 0; i < files.length; i++) {
            var filepath = files[i]
            filepath = normalizeFilepath(filepath)
            var resp = await jira.uploadAttachment(issueKey, filepath)
            trace(resp)
          }
          context.document.showMessage(`Uploaded ${files.length} ${noun} to ${issueKey}`)
        }
      }
    }

    setInterval(processUploadRequests, 100)
  })
}

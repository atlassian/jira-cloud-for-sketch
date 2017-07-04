import '../../defaultImports'
import jiraWebUI from '../../jira-webui'
import {
  executeSafely,
  executeSafelyAsync,
  openInBrowser,
  normalizeFilepath
} from '../../util'
import { isAuthorized } from '../../auth'
import Connect from '../connect'
import { getDraggedFiles } from '../../pasteboard'
import { trace } from '../../logger'
import Filters from './filters'
import { OFFLINE_DEV } from '../../config'
const JIRA = require(OFFLINE_DEV ? '../../mock-jira' : '../../jira')

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
      height: 325,
      width: 450,
      handlers: {
        onReady () {
          filters.onReady()
        },
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
        },
        filterSelected (filterKey) {
          filters.onFilterChanged(filterKey)
        }
      }
    })

    var jira = new JIRA()
    var filters = new Filters(context, webUI, jira)

    var checkingActions = false

    function checkActions () {
      if (!checkingActions) {
        checkingActions = true
        executeSafelyAsync(context, async function () {
          await checkUploadRequests()
        })
        checkingActions = false
      }
    }

    setInterval(checkActions, 100)

    async function checkUploadRequests () {
      if (uploadRequests.length > 0) {
        var uploadRequest = uploadRequests.pop()
        var issueKey = uploadRequest.issueKey
        var files = uploadRequest.files
        webUI.dispatchWindowEvent('jira.upload.queued', {
          issueKey: issueKey,
          count: files.length
        })
        for (var i = 0; i < files.length; i++) {
          var filepath = files[i]
          filepath = normalizeFilepath(filepath)
          var resp = await jira.uploadAttachment(issueKey, filepath)
          trace(resp)
          webUI.dispatchWindowEvent('jira.upload.complete', {
            issueKey: issueKey,
            count: 1
          })
        }
      }
    }
  })
}

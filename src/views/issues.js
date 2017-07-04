import '../defaultImports'
import jiraWebUI from '../jira-webui'
import {
  executeSafely,
  executeSafelyAsync,
  openInBrowser,
  normalizeFilepath
} from '../util'
import { isAuthorized } from '../auth'
import Connect from './connect'
import { getDraggedFiles } from '../pasteboard'
import { trace } from '../logger'
import { OFFLINE_DEV } from '../config'
const JIRA = require(OFFLINE_DEV ? '../mock-jira' : '../jira')

export default async function (context) {
  executeSafelyAsync(context, async function () {
    if (!OFFLINE_DEV && !isAuthorized()) {
      return Connect(context)
    }

    var jira = new JIRA()

    var ready = false
    var uploadRequests = []
    var nextFilterKey = null
    var currentFilterKey = null

    const webUI = jiraWebUI(context, {
      name: 'issues',
      background: MSImmutableColor.colorWithSVGString(
        '#e7e7e7'
      ).NSColorWithColorSpace(null),
      height: 325,
      width: 450,
      handlers: {
        onReady () {
          ready = true
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
          nextFilterKey = filterKey
        }
      }
    })

    var checkOnReady = function () {
      if (ready) {
        nextFilterKey = 'recently-viewed'
        dispatchWindowEvent(webUI, 'jira.filters.updated', {
          filters: jira.jqlFilters,
          filterSelected: nextFilterKey
        })
        /* only run once */
        checkOnReady = function () {}
      }
    }

    var checkingActions = false

    function checkActions () {
      if (!checkingActions) {
        checkingActions = true
        executeSafelyAsync(context, async function () {
          checkOnReady()
          await checkNewFilter()
          await checkUploadRequests()
        })
        checkingActions = false
      }
    }

    setInterval(checkActions, 100)

    async function checkNewFilter () {
      if (nextFilterKey) {
        let loadingFilter = (currentFilterKey = nextFilterKey)
        nextFilterKey = null
        dispatchWindowEvent(webUI, 'jira.issues.loading', {
          filterKey: loadingFilter
        })
        var issues = await jira.getFilteredIssues(loadingFilter)
        // if another filter has been selected in the meantime, ignore this result
        if (loadingFilter == currentFilterKey) {
          dispatchWindowEvent(webUI, 'jira.issues.loaded', {
            issues: issues
          })
        }
      }
    }

    async function checkUploadRequests () {
      if (uploadRequests.length > 0) {
        var uploadRequest = uploadRequests.pop()
        var issueKey = uploadRequest.issueKey
        var files = uploadRequest.files
        dispatchWindowEvent(webUI, 'jira.upload.queued', {
          issueKey: issueKey,
          count: files.length
        })
        for (var i = 0; i < files.length; i++) {
          var filepath = files[i]
          filepath = normalizeFilepath(filepath)
          var resp = await jira.uploadAttachment(issueKey, filepath)
          trace(resp)
          dispatchWindowEvent(webUI, 'jira.upload.complete', {
            issueKey: issueKey,
            count: 1
          })
        }
      }
    }
  })
}

function dispatchWindowEvent (webUI, eventName, eventDetail) {
  var eventJson = JSON.stringify({ detail: eventDetail })
  webUI.eval(
    `window.dispatchEvent(new CustomEvent('${eventName}', ${eventJson}))`
  )
}

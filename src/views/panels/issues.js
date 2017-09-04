import { createWebUI, IssuePanelId } from './webui-common'
import Filters from './helpers/filters'
import Uploads from './helpers/uploads'
import Attachments from './helpers/attachments'
import { analytics } from '../../analytics'
import { feedbackUrl } from '../../config'
import { openInBrowser } from '../../util'
import { akGridSizeUnitless } from '@atlaskit/util-shared-styles'
import { titlebarHeight } from './ui-constants'
import Jira from '../../jira'
import openConnectPanel from './connect'
import keepOrReplaceAlert from '../alerts/keep-or-replace'
import {
  setSelectedIssueKey,
  setExportSelectedLayersFn,
  setOnSelectionChangedFn
} from '../../plugin-state'
import {
  setLastViewedIssueForDocument,
  getLastExportedIssueForSelectedLayers,
  areLayersSelected
} from '../../export'

const issueListDimensions = [
  akGridSizeUnitless * 64,
  akGridSizeUnitless * 45 + titlebarHeight
]

const issueViewDimensions = [
  akGridSizeUnitless * 64,
  akGridSizeUnitless * 50
]

/**
 * Spawns the 'Jira' panel for browsing and interacting with Jira issues.
 *
 * @param {Object} context provided by Sketch
 * @return {Object} a WebUI for the launched panel
 */
export default async function (context) {
  const webUI = createWebUI(context, IssuePanelId, 'issues.html', {
    width: issueListDimensions[0],
    height: issueListDimensions[1],
    onClose: function () {
      setExportSelectedLayersFn(null)
      setSelectedIssueKey(null)
    },
    handlers: {
      async loadFilters () {
        return filters.loadFilters()
      },
      loadProfile () {
        return jira.getProfile()
      },
      loadIssuesForFilter (filterKey) {
        return filters.onFilterChanged(filterKey)
      },
      /**
       * Determines an appropriate issue to preselect in the issue panel, based
       * on the user's past exports for the current selection or document.
       *
       * @return {string} an issue key identifying the issue to preselect
       */
      getSuggestedPreselectedIssueKey () {
        return getLastExportedIssueForSelectedLayers(context)
        /* Only suggest issues when layers are selected, for now */
        /* || getLastViewedIssueForDocument(context) */
      },
      getDroppedFiles () {
        return uploads.getDroppedFiles()
      },
      exportSelectedLayers () {
        uploads.exportSelectedLayersToSelectedIssue()
      },
      uploadAttachment (issueKey, attachment, progress) {
        return uploads.uploadAttachment(issueKey, attachment, progress)
      },
      promptKeepOrReplace (issueKey, matchingImages) {
        return keepOrReplaceAlert(context, issueKey, matchingImages)
      },
      getIssue (issueKey, updateHistory, suppressError) {
        return attachments.getIssue(issueKey, updateHistory, suppressError)
      },
      onIssueSelected (issueKey) {
        webUI.resizePanel(...issueViewDimensions)
        setSelectedIssueKey(issueKey)
        setLastViewedIssueForDocument(context, issueKey)
      },
      onIssueDeselected (issueKey) {
        webUI.resizePanel(...issueListDimensions)
        setSelectedIssueKey(null)
        setLastViewedIssueForDocument(context, null)
      },
      areLayersSelected () {
        return areLayersSelected(context)
      },
      getWatchers (issueKey) {
        return jira.getWatchers(issueKey)
      },
      getThumbnail (url, mimeType) {
        return attachments.getThumbnail(url, mimeType)
      },
      openAttachment (url, filename, progress) {
        return attachments.openAttachment(url, filename, progress)
      },
      deleteAttachment (id) {
        return attachments.deleteAttachment(id)
      },
      addComment (issueKey, comment) {
        return jira.addComment(issueKey, comment)
      },
      findUsersForPicker (query) {
        return jira.findUsersForPicker(query)
      },
      viewSettings () {
        webUI.panel.close()
        openConnectPanel(context)
      },
      reauthorize () {
        webUI.panel.close()
        openConnectPanel(context)
      },
      feedback () {
        openInBrowser(feedbackUrl)
      }
    }
  })

  const jira = new Jira()
  const filters = new Filters(context, webUI, jira)
  const attachments = new Attachments(context, webUI, jira)
  const uploads = new Uploads(context, webUI, jira, attachments)

  setExportSelectedLayersFn(function () {
    uploads.exportSelectedLayersToSelectedIssue()
  })
  function updateHasSelection () {
    webUI.invokeExposedFunction('setHasSelection', areLayersSelected(context))
  }
  setOnSelectionChangedFn(updateHasSelection)
  analytics('openPanelIssues')
  await webUI.waitUntilBridgeInitialized()
  return webUI
}

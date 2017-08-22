import { assign } from 'lodash'
import { executeSafely, openInBrowser } from '../../util'
import { jiraSketchIntegrationFaqUrl } from '../../config'
import { trace } from '../../logger'
import createBridgedWebUI from '../bridge/host'
import analytics from '../../analytics'
import { titlebarHeight } from './ui-constants'
import panelDelegate from './panel-delegate'

/**
 * Important to note:
 *
 * stringByEvaluatingJavaScriptFromString (used by WebUI.eval) has limits:
 *
 *  - JavaScript allocations greater than 10MB are not allowed
 *  - JavaScript that takes longer than 10 seconds to execute is not allowed
 *
 * In the former, you'll get an exception generated, but in the latter it may
 * well fail 'silently'.
 *
 * via https://stackoverflow.com/a/7389032
 */
export function createWebUI (context, identifier, page, options) {
  // default options
  options = assign(
    {
      identifier,
      page,
      onlyShowCloseButton: true,
      hideTitleBar: false,
      title: ' ',
      styleMask: NSTitledWindowMask | NSClosableWindowMask
    },
    options
  )

  if (options.backgroundColor) {
    options.background = MSImmutableColor.colorWithSVGString(
        options.backgroundColor
      ).NSColorWithColorSpace(null)
  }

  // default handlers
  options.handlers = assign(
    {
      analytics (eventName, properties) {
        analytics[eventName](properties)
      },
      openInBrowser (url) {
        executeSafely(context, function () {
          openInBrowser(url)
        })
      },
      openFaqPage (topic) {
        executeSafely(context, function () {
          openInBrowser(`${jiraSketchIntegrationFaqUrl}#${topic}`)
        })
      },
      resizePanel (width, height, animate) {
        webUI.resizePanel(width, height, animate)
      }
    },
    options.handlers
  )

  const webUI = createBridgedWebUI(context, options.page, options)

  webUI.resizePanel = function (width, height, animate) {
    // resize WebView
    const webViewFrame = webUI.webView.frame()
    webUI.webView.setFrame(NSMakeRect(
      webViewFrame.origin.x,
      options.hideTitleBar ? -titlebarHeight : 0,
      width,
      height - (options.hideTitleBar ? 0 : titlebarHeight)
    ))

    // resize NSPanel
    const panelFrame = webUI.panel.frame()
    const newPanelY = panelFrame.origin.y + panelFrame.size.height - height
    webUI.panel.setFrame_display_animate(NSMakeRect(panelFrame.origin.x, newPanelY, width, height), true, animate)
  }

  // ASP-12: workaround incorrect sizing in sketch-module-web-view
  webUI.resizePanel(options.width, options.height)

  // default panel behaviour
  // webUI.panel.hidesOnDeactivate = false
  // webUI.panel.setLevel(NSNormalWindowLevel)

  webUI.panel.delegate = panelDelegate({
    onClose: () => {
      trace(`Panel closed: ${identifier}`)
      NSThread.mainThread().threadDictionary().removeObjectForKey(identifier)
      options.onClose && options.onClose()
    }
  })

  return webUI
}

export function findPanel (id) {
  return NSThread.mainThread().threadDictionary()[id]
}

export function closePanel (id) {
  const panel = findPanel(id)
  if (panel) {
    try {
      panel.close()
    } catch (e) {
      trace(`Exception raised when closing window (already closed?): ${e}`)
    }
  }
}

export function closeAllPluginPanels () {
  closePanel(IssuePanelId)
  closePanel(ConnectPanelId)
}

const panelPrefix = 'atlassian-sketch-plugin'
export const IssuePanelId = `${panelPrefix}-issues`
export const ConnectPanelId = `${panelPrefix}-connect`

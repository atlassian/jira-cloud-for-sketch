import { assign } from 'lodash'
import { executeSafely, openInBrowser } from '../../util'
import * as config from '../../config'
import { trace } from '../../logger'
import createBridgedWebUI from '../bridge/host'
import { analytics, analyticsBatch } from '../../analytics'
import { titlebarHeight } from './ui-constants'
import panelDelegate from './panel-delegate'

/**
 * Encapsulates common options used by the plugin's panels.
 *
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
 *
 * @param {Object} context provided by Sketch
 * @param {string} identifier a unique identifier for the WebUI. Note:
 * `sketch-module-web-view` stores active NSPanel objects under this ID in the
 * main thread's threadDictionary
 * @param {string} page the name of the HTML file in the `Resources` directory
 * to be rendered as the content of the WebView.
 * @param {Object} options used to configure the WebUI. Some options are
 * documented here, some are passed through to `createBridgedWebUI` (which
 * also passes some on to `sketch-module-web-view`). Sorry for the multiple
 * levels of abstraction here - hopefully we'll be able to incorporate some of
 * this into `sketch-module-web-view`
 * @param {string} options.backgroundColor a hex color string (e.g. '#abadab')
 * @param {boolean} options.hideTitleBar whether the panel's title bar should
 * be hidden
 * @param {number} options.width the width of the panel in pixels
 * @param {number} options.height the height of the panel in pixels
 * @param {function} [options.onClose] invoked when the panel is closed
 * @return {Promise<WebUI>} a WebUI initialized with the provided options
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
        analytics(eventName, properties)
      },
      analyticsBatch (events) {
        analyticsBatch(events)
      },
      openInBrowser (url) {
        executeSafely(context, function () {
          openInBrowser(url)
        })
      },
      openFaqPage (topic) {
        executeSafely(context, function () {
          openInBrowser(`${config.jiraSketchIntegrationFaqUrl}#${topic}`)
        })
      },
      resizePanel (width, height, animate) {
        webUI.resizePanel(width, height, animate)
      },
      config () {
        return config
      }
    },
    options.handlers
  )

  const webUI = createBridgedWebUI(context, options)

  /**
   * @param {number} width the new panel width in pixels
   * @param {number} height the new panel height in pixels
   * @param {boolean} [animate] animate the resize (generally doesn't look good
   * unless you've specifically built the client-side to support it)
   */
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
      webUI.webView.close()
    }
  })

  return webUI
}

/**
 * `sketch-module-web-view` stores active NSPanel objects under this ID in the
 * main thread's threadDictionary. This function retrieves them again.
 *
 * @param {string} id the identifier used to create an NSPanel
 * @return {Object} the NSPanel
 */
export function findPanel (id) {
  return NSThread.mainThread().threadDictionary()[id]
}

/**
 * Look up an NSPanel by id, then close it if it exists.
 *
 * @param {string} id the identifier used to create an NSPanel
 */
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

/**
 * Close all known plugin panels.
 */
export function closeAllPluginPanels () {
  closePanel(IssuePanelId)
  closePanel(ConnectPanelId)
}

const panelPrefix = 'atlassian-sketch-plugin'

/**
 * The identifier for the 'JIRA' panel
 */
export const IssuePanelId = `${panelPrefix}-issues`
/**
 * The identifier for the 'Connect' panel
 */
export const ConnectPanelId = `${panelPrefix}-connect`

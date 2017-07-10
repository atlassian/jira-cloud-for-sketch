import WebUI from 'sketch-module-web-view'
import { assign } from 'lodash'
import { randomHex } from './util'
import event from './analytics'

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
export default function (context, options) {
  options = assign(
    {
      identifier: `jira-sketch-plugin.${options.name}.` + randomHex(0xffffffff),
      page: `${options.name}.html`,
      onlyShowCloseButton: true,
      hideTitleBar: false,
      title: ' ',
      styleMask: NSTitledWindowMask | NSClosableWindowMask
    },
    options
  )
  var w = new WebUI(context, options.page, options)
  // w.panel.hidesOnDeactivate = false
  // w.panel.setLevel(NSNormalWindowLevel)
  w.dispatchWindowEvent = function (eventName, eventDetail) {
    var eventJson = JSON.stringify({ detail: eventDetail })
    w.eval(
      `window.dispatchEvent(new CustomEvent('${eventName}', ${eventJson}))`
    )
  }
  event(context, `${options.name}PanelOpened`)
  return w
}

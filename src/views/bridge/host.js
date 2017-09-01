/*
 * The server-side (CocoaScript) of the CocoaScript-WebView bridge. Wraps the
 * excellent `sketch-module-web-view` module and should be used to create any
 * any NSPanels used by the plugin.
 */

import WebUI from 'sketch-module-web-view'
import {
  SketchBridgeFunctionResultEvent,
  SketchBridgeFunctionCallbackEvent,
  SketchBridgeFunctionName,
  SketchBridgeFunctionCallback,
  SketchExposedFunctionTriggerEvent,
  SketchExposedFunctionCallback,
  SketchBridgeClientInitializedFlag
} from './common'
import { isTraceEnabled, trace } from '../../logger'
import { retryUntilTruthy } from '../../util'
import { assignIn } from 'lodash'
import uuid from 'uuid/v4'

/**
 * @param {Object} context provided by Sketch
 * @param {Object} options used to configure the WebUI. Some options are
 * documented here, others are passed through to 'sketch-module-web-view'
 * @param {function[]} options.handlers an array of handler functions that can
 * be invoked from the client-side by ./client#bridgedFunction and
 * sketch-module-web-view/client
 * @param {string} options.page the name of the HTML file in the `Resources`
 * directory to be rendered as the content of the WebView.
 * @return {Promise<WebUI>} a WebUI initialized for use with the CocoaScript-JavaScript bridge
 */
export default function createBridgedWebUI (context, options) {
  let webUI
  /**
   * The handler function invoked by ./client#bridgedFunction. Delegates
   * on to other handler functions, and translates return values or thrown
   * exceptions into custom window events that are handled in ./client.
   */
  options.handlers[SketchBridgeFunctionName] = async function (invocationId, handlerFunctionName) {
    isTraceEnabled && trace(`${JSON.stringify(arguments)}`)

    const args = [].slice.call(arguments).slice(2).map((arg, callbackIndex) => {
      if (arg == SketchBridgeFunctionCallback) {
        return function () {
          webUI.dispatchWindowEvent(SketchBridgeFunctionCallbackEvent, {
            invocationId,
            callbackIndex,
            args: [].slice.call(arguments)
          })
        }
      } else {
        return arg
      }
    })

    let result = null
    let error = null
    try {
      result = await options.handlers[handlerFunctionName](...args)
    } catch (e) {
      // An error caught here could be a wrapped NSError or a plain old
      // JavaScript error. They each need to be serialized a little
      // differently.
      if (e.class && e.class().isSubclassOfClass(NSError)) {
        error = {
          error: String.valueOf(e),
          name: e.class() + '',
          message: e.localizedDescription() + ''
        }
      } else {
        // the default string representation of the error omits most fields
        error = assignIn({
          error: String.valueOf(e),
          // for some reason, these properties are not copied by assignIn
          name: e.name,
          message: e.message
        }, e)
      }
      trace(error)
    }
    webUI.dispatchWindowEvent(SketchBridgeFunctionResultEvent, {invocationId, result, error, handlerFunctionName})
  }

  const exposedFunctionInvocations = {}

  options.handlers[SketchExposedFunctionCallback] = async function (returnValue) {
    const { id, functionName, result, error } = returnValue
    const invocation = exposedFunctionInvocations[id]
    if (!invocation) {
      trace(`No exposed function invocation found for id ${id} (${functionName})`)
      return
    }
    if (error) {
      invocation.reject(error)
    } else {
      invocation.resolve(result)
    }
    delete exposedFunctionInvocations[id]
  }

  webUI = new WebUI(context, options.page, options)

  /**
   * Trigger a new CustomEvent on the `window` object of the WebView.
   * @param {string} eventName the event name
   * @param {Object} eventDetail the event payload, used as the `detail`
   * property of the event
   */
  webUI.dispatchWindowEvent = function (eventName, eventDetail) {
    var eventJson = JSON.stringify({ detail: eventDetail })
    isTraceEnabled() && trace(`window event: ${eventName} ${eventJson}`)
    webUI.eval(
      `window.dispatchEvent(new CustomEvent('${eventName}', ${eventJson}))`
    )
  }

  /**
   * Invoke a function that has been exposed by ./client#exposeFunction
   * @param {string} functionName name of the exposed function
   * @param {*...} args arguments to be passed to the exposed function
   * @return {Promise<*>} a Promise that will be resolved or rejected with the
   * result returned or thrown by the exposed function
   */
  webUI.invokeExposedFunction = function (functionName, ...args) {
    return new Promise(function (resolve, reject) {
      const id = uuid()
      exposedFunctionInvocations[id] = {resolve, reject}
      webUI.dispatchWindowEvent(SketchExposedFunctionTriggerEvent, {
        id, functionName, args
      })
    })
  }

  /**
   * @return {Promise} a Promise that will be resolved when the client
   * indicates that the bridge has been initialized
   */
  webUI.waitUntilBridgeInitialized = async function () {
    return retryUntilTruthy(() => {
      return webUI.eval(`window.${SketchBridgeClientInitializedFlag}`)
    }, 0, 100)
  }

  return webUI
}

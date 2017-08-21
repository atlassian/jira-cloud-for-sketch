import WebUI from 'sketch-module-web-view'
import {
  SketchBridgeFunctionResultEvent,
  SketchBridgeFunctionCallbackEvent,
  SketchBridgeFunctionName,
  SketchBridgeFunctionCallback
} from './common'
import { isTraceEnabled, trace } from '../../logger'
import { assign } from 'lodash'

export default function createBridgedWebUI (context, htmlName, options) {
  let webUI
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
      if (e.class && e.class().isSubclassOfClass(NSError)) {
        error = {
          error: String.valueOf(e),
          name: e.class() + '',
          message: e.localizedDescription() + ''
        }
      } else {
        // the default string representation of the error omits most fields
        error = assign({error: String.valueOf(e)}, e)
      }
      trace(error)
    }
    webUI.dispatchWindowEvent(SketchBridgeFunctionResultEvent, {invocationId, result, error, handlerFunctionName})
  }

  webUI = new WebUI(context, options.page, options)
  webUI.dispatchWindowEvent = function (eventName, eventDetail) {
    var eventJson = JSON.stringify({ detail: eventDetail })
    isTraceEnabled() && trace(`window event: ${eventName} ${eventJson}`)
    webUI.eval(
      `window.dispatchEvent(new CustomEvent('${eventName}', ${eventJson}))`
    )
  }
  return webUI
}

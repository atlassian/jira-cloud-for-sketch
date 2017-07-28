import WebUI from 'sketch-module-web-view'
import { SketchBridgeFunctionResultEvent, SketchBridgeFunctionName } from './common'
import { isTraceEnabled, trace } from '../../logger'

export default function createBridgedWebUI (context, htmlName, options) {
  let webUI
  options.handlers[SketchBridgeFunctionName] = async (id, handlerFunctionName) => {
    const args = [].slice.call(arguments).slice(2)
    trace(`${id} ${handlerFunctionName} ${JSON.stringify(args)}`)
    let result = null
    let error = null
    try {
      result = await options.handlers[handlerFunctionName](...args)
    } catch (e) {
      error = e
    }
    webUI.dispatchWindowEvent(SketchBridgeFunctionResultEvent, {id, result, error})
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

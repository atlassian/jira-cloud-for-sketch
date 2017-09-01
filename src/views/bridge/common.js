/*
 * Shared constants and helper functions thar are used on both sides of the
 * bridge. This file (and any imports) must be both valid CocoaScript and
 * JavaScript!
 */

export const SketchBridgeFunctionResultEvent = 'sketch.bridge.function.result'
export const SketchBridgeFunctionCallbackEvent = 'sketch.bridge.function.callback'
export const SketchBridgeFunctionName = '__bridgedFunction'
export const SketchBridgeFunctionCallback = '__bridgedFunctionCallback'
export const SketchExposedFunctionTriggerEvent = 'sketch.bridge.exposed.function.trigger'
export const SketchExposedFunctionCallback = '__exposedFunctionCallback'
export const SketchBridgeClientInitializedFlag = '__SketchBridgeClientInitialized'

export function invocationKeyForTests (functionName, arg0, arg1, etc) {
  return `${JSON.stringify([].slice.call(arguments))}`
}

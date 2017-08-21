export const SketchBridgeFunctionResultEvent = 'sketch.bridge.function.result'
export const SketchBridgeFunctionCallbackEvent = 'sketch.bridge.function.callback'
export const SketchBridgeFunctionName = '__bridgedFunctionCall'
export const SketchBridgeFunctionCallback = '__bridgedFunctionCallback'

export function invocationKeyForTests (functionName, arg0, arg1, etc) {
  return `${JSON.stringify([].slice.call(arguments))}`
}

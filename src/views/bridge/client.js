import pluginCall from 'sketch-module-web-view/client'
import uuid from 'uuid/v4'
import {
  SketchBridgeFunctionResultEvent,
  SketchBridgeFunctionCallbackEvent,
  SketchBridgeFunctionName,
  SketchBridgeFunctionCallback
} from './common'

const invocations = window.__bridgeFunctionInvocations = window.__bridgeFunctionInvocations || {}

if (window.__bridgeFunctionResultEventListener === undefined) {
  window.__bridgeFunctionResultEventListener = function (event) {
    const { invocationId, error, result } = event.detail
    var invocation = invocations[invocationId]
    if (!invocation) {
      console.error(`No __bridgeFunctionInvocation found for id '${invocationId}'`)
      return
    }
    if (error) {
      // console.log(`rejecting __bridgeFunctionPromise ${id}`)
      invocation.reject(error)
    } else {
      // console.log(`resolving __bridgeFunctionPromise ${id}`)
      invocation.resolve(result)
    }
    delete invocations[invocationId]
  }
  window.addEventListener(
    SketchBridgeFunctionResultEvent,
    window.__bridgeFunctionResultEventListener
  )
}

if (window.__bridgeFunctionCallbackEventListener === undefined) {
  window.__bridgeFunctionCallbackEventListener = function (event) {
    const { invocationId, callbackIndex, args } = event.detail
    var invocation = invocations[invocationId]
    if (!invocation) {
      console.error(`No __bridgeFunctionInvocation found for id '${invocationId}'`)
      return
    }
    const invocationCallback = invocation.callbacks[callbackIndex]
    if (!invocationCallback) {
      console.error(
        `No callback found for invocation id '${invocationId}' ` +
        `and callback index '${callbackIndex}'`
      )
      return
    }
    invocationCallback(...args)
  }
  window.addEventListener(
    SketchBridgeFunctionCallbackEvent,
    window.__bridgeFunctionCallbackEventListener
  )
}

export default function bridgedFunctionCall (functionName, resultMapper) {
  // console.log(`creating bridge function ${functionName} with id ${promiseId}`)
  return function () {
    const callbacks = []
    const args = [].slice.call(arguments).map((arg, index) => {
      if (typeof arg === 'function') {
        callbacks[index] = arg
        return SketchBridgeFunctionCallback
      } else {
        return arg
      }
    })
    const invocationId = uuid()
    return new Promise(function (resolve, reject) {
      invocations[invocationId] = {resolve, reject, callbacks}
      pluginCall(SketchBridgeFunctionName, invocationId, functionName, ...args)
    })
    .then(resultMapper || (x => x))
  }
}

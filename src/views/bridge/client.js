import pluginCall from 'sketch-module-web-view/client'
import uuid from 'uuid/v4'
import {
  SketchBridgeFunctionResultEvent,
  SketchBridgeFunctionCallbackEvent,
  SketchBridgeFunctionName,
  SketchBridgeFunctionCallback
} from './common'

const invocations = window.__bridgeFunctionInvocations = window.__bridgeFunctionInvocations || {}
const globalErrorHandlers = []

if (window.__bridgeFunctionResultEventListener === undefined) {
  window.__bridgeFunctionResultEventListener = function (event) {
    const { invocationId, error, result } = event.detail
    var invocation = invocations[invocationId]
    if (!invocation) {
      console.error(`No __bridgeFunctionInvocation found for id '${invocationId}'`)
      return
    }
    if (error) {
      // check if one of the global error handlers can handle it
      if (invokeGlobalErrorHandlers(error, invocation.retry)) {
        // ... if so, don't delete the invocation handler to allow for retry
        return
      } else {
        // ... if not, reject the promise
        invocation.reject(error)
      }
    } else {
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
      const retry = () => {
        pluginCall(SketchBridgeFunctionName, invocationId, functionName, ...args)
      }
      invocations[invocationId] = {resolve, reject, callbacks, retry}
      retry()
    })
    .then(resultMapper || (x => x))
  }
}

function invokeGlobalErrorHandlers (error, retry) {
  for (var i = 0; i < globalErrorHandlers.length; i++) {
    const handler = globalErrorHandlers[i]
    try {
      if (handler(error, retry)) {
        return true
      }
    } catch (e) {
      console.error(`error invoking global error handler: ${e}`)
    }
  }
  return false
}

export function addGlobalErrorHandler (handler) {
  globalErrorHandlers.push(handler)
}

export function removeGlobalErrorHandler (handler) {
  const index = globalErrorHandlers.indexOf(handler)
  globalErrorHandlers.splice(index, 1)
}

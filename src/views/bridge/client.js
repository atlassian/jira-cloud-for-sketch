import pluginCall from 'sketch-module-web-view/client'
import uuid from 'uuid/v4'
import { forOwn, assign } from 'lodash'
import {
  SketchBridgeFunctionResultEvent,
  SketchBridgeFunctionCallbackEvent,
  SketchBridgeFunctionName,
  SketchBridgeFunctionCallback,
  invocationKeyForTests
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
        `No callback found for invocation id '${invocationId}' and callback ` +
        `index '${callbackIndex}'. Did window location change?`
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
      invocations[invocationId] = {resolve, reject, callbacks, retry, functionName, args}
      retry()
    })
    .then(resultMapper || (x => x))
  }
}

// for interactive testing
window.__invokeBridgedFunction = window.__invokeBridgedFunction || bridgedFunctionCall

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

/** Test utilities **/

window.__addBridgeResponsesForTests = window.__addBridgeResponsesForTests || function (responses) {
  console.log('Bridge responses for tests', responses)
  function tryToRespondToPendingInvocations () {
    forOwn(invocations, async (invocation, invocationId) => {
      const key = invocationKeyForTests(invocation.functionName, ...invocation.args)
      const response = responses[key]
      if (response) {
        console.log(`Found bridge response for for ${key}`, response)
        window.__bridgeFunctionResultEventListener({
          detail: assign({invocationId}, response)
        })
        delete invocations[invocationId]
        if (response.once) {
          delete responses[key]
        }
      } else {
        console.log(`No bridge response yet for ${key}`)
      }
    })
  }
  // pluginCall updates the URL hash to communicate with the parent NSPanel
  window.addEventListener('hashchange', () => {
    tryToRespondToPendingInvocations()
  })
  // handle any invocations that were registered before we set up the listener
  tryToRespondToPendingInvocations()
}

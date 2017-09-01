/*
 * The client-side (JavaScript) of the CocoaScript-WebView bridge. To be
 * included client-side on the page rendered within the WebView.
 */

import pluginCall from 'sketch-module-web-view/client'
import uuid from 'uuid/v4'
import { forOwn, assign } from 'lodash'
import {
  SketchBridgeFunctionResultEvent,
  SketchBridgeFunctionCallbackEvent,
  SketchBridgeFunctionName,
  SketchBridgeFunctionCallback,
  SketchExposedFunctionTriggerEvent,
  SketchExposedFunctionCallback,
  SketchBridgeClientInitializedFlag,
  invocationKeyForTests
} from './common'

/**
 * Pending bridged function invocations that have yet to be rejected or
 * resolved. Invocation entries are keyed by a UUID and have the following
 * properties:
 *  {
 *    resolve:      A Promise `resolve` function that will be invoked if the
 *                  bridged invocation completes normally.
 *    reject:       A Promise `reject` function that will be invoked if the
 *                  bridged invocation throws an error AND no global error
 *                  handler can handle it.
 *    callbacks:    An array of callback functions passed to the bridged
 *                  function. Callbacks are indexed by their original position
 *                  in the argument array.
 *    retry:        A function used by global error handlers to retry the
 *                  bridged function invocation without rejecting the original
 *                  promise.
 *    functionName: The name of the bridge function. Used for tests, logging,
 *                  and debugging.
 *    args:         The arguments passed to the bridge function. Used for
 *                  tests, logging, and debugging.
 *  }
 */
const invocations = window.__bridgeFunctionInvocations = window.__bridgeFunctionInvocations || {}

/**
 * Creates a re-usable JavaScript function that invokes a named CocoaScript
 * handler function attached to the parent NSPanel. Any arguments passed to the
 * JavaScript function will be passed on to the CocoaScript handler. The
 * function returns a Promise that will be resolved or rejected when the
 * corresponding CocoaScript handler function returns or throws. Callbacks are
 * also supported, and work as expected.
 *
 * @param {string} functionName the name of the CocoaScript handler. Must
 * match a handler function registered on the parent NSPanel
 * @param {functin} [resultMapper] an optional function that will be used
 * to map the returned value before resolving the promise
 * @return {function} returns a re-usable function that passes its arguments
 * through to the named CocoaScript handler, and returns a Promise that will
 * be resolved or rejected when the handler completes or throws
 */
export function bridgedFunction (functionName, resultMapper) {
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

if (window.__bridgeFunctionResultEventListener === undefined) {
  /**
   * Translates bridged function result events sent by the CocoaScript side of
   * the bridge into resolved or rejected invocations. The pending invocation
   * is removed after being resolved or rejected, or if a global error handler
   * handles the returned error.
   *
   * @param {CustomEvent} event sent when a CocoaScript handler function
   * completes
   * @param {string} event.detail.invocationId the id of the pending invocation
   * @param {Object} event.detail.error a serialized error object will be
   * handled by a global error handler, or used to reject the pending
   * invocation promise
   * @param {Object} event.detail.result a result object to be used to resolve
   * the pending invocation promise
   */
  window.__bridgeFunctionResultEventListener = function (event) {
    const { invocationId, error, result } = event.detail
    const invocation = invocations[invocationId]
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
  /**
   * Translates bridged function callback events sent by the CocoaScript side
   * of the bridge into invocations of the callbacks passed into the bridged
   * JavaScript function.
   *
   * @param {CustomEvent} event sent when a CocoaScript handler function
   * completes
   * @param {string} event.detail.invocationId the id of the pending invocation
   * @param {number} event.detail.callbackIndex the index of the callback
   * function in the original array passed to the bridged JavaScript function
   * @param {Object[]} event.detail.args an array of arguments to pass to the
   * callback function
   */
  window.__bridgeFunctionCallbackEventListener = function (event) {
    const { invocationId, callbackIndex, args } = event.detail
    const invocation = invocations[invocationId]
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

/**
 * Global error handlers. These handlers will first be given a chance to handle
 * any errors coming from the CocoaScript side of the bridge. If no handler can
 * handle a particular error, the invocation that triggered the error will be
 * rejected.
 */
const globalErrorHandlers = []

export function addGlobalErrorHandler (handler) {
  globalErrorHandlers.push(handler)
}

export function removeGlobalErrorHandler (handler) {
  const index = globalErrorHandlers.indexOf(handler)
  globalErrorHandlers.splice(index, 1)
}

/**
 * Invoked when a CocoaScript handler function throws an error, before
 * rejecting the invocation that triggered the error.
 *
 * @param {Object} error an error from the CocoaScript side of the bridge
 * @param {function} retry a function that will retry the original operation
 * @return {boolean} true if a handler handled the error, false otherwise
 */
function invokeGlobalErrorHandlers (error, retry) {
  for (let i = 0; i < globalErrorHandlers.length; i++) {
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

const exposedFunctions = {}

/**
 * Expose a function to CocoaScript, allowing a JavaScript function to be
 * invoked by WebUI#invokeExposedFunction (see host.js).
 *
 * @param {string} name the name the function will be exposed as in the host
 * @param {function} fn the function being exposed
 * @param {boolean} replace an error is logged if this flag is false and a
 * function of this name is already registered
 */
export function exposeFunction (name, fn, replace) {
  if (!replace && exposedFunctions[name]) {
    console.error(`Function already registered with name (${name})!`)
  }
  exposedFunctions[name] = fn
}

/**
 * Marks the bridge as initialized on the client side. This should be invoked
 * after all the necessary functions have been exposed via `exposeFunction`.
 */
export function markBridgeAsInitialized () {
  window[SketchBridgeClientInitializedFlag] = true
}

if (window.__exposedFunctionTriggerEventListener === undefined) {
  /**
   * Listens for exposed function invocation events sent by the CocoaScript
   * side of the bridge, invokes the corresponding function, and passed the
   * result back over the CocoaScript bridge.
   *
   * @param {CustomEvent} event sent when CocoaScript invokes an exposed
   * JavaScript function
   * @param {string} event.detail.functionName the name of the exposed function
   * @param {string} event.detail.id an identifier for the invocation
   * @param {*[]} event.detail.args an array of arguments to pass to the
   * exposed function
   */
  window.__exposedFunctionTriggerEventListener = async function (event) {
    const { functionName, id, args } = event.detail
    const fn = exposedFunctions[functionName]
    if (!fn) {
      console.error(`No exposedFunction found for name '${functionName}'`)
      return
    }
    const returnValue = {functionName, id}
    try {
      returnValue.result = await fn(...args)
    } catch (e) {
      returnValue.error = e
    }
    pluginCall(SketchExposedFunctionCallback, returnValue)
  }
  window.addEventListener(
    SketchExposedFunctionTriggerEvent,
    window.__exposedFunctionTriggerEventListener
  )
}

/** Test utilities **/

// Add a handle on the window for interactive testing of bridged function calls
window.__invokeBridgedFunction = window.__invokeBridgedFunction || function (functionName) {
  bridgedFunction(functionName)(arguments.slice(1))
}

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

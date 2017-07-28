import pluginCall from 'sketch-module-web-view/client'
import uuid from 'uuid/v4'
import { SketchBridgeFunctionResultEvent, SketchBridgeFunctionName } from './common'

const bridgeFunctionPromises = window.__bridgeFunctionPromises = window.__bridgeFunctionPromises || {}
if (window.__bridgeFunctionResultEventListener === undefined) {
  window.__bridgeFunctionResultEventListener = function (event) {
    const { id, error, result } = event.detail
    var promise = bridgeFunctionPromises[id]
    if (!promise) {
      // console.error(`No __bridgeFunctionPromises found for id '${id}'`)
      return
    }
    if (error) {
      // console.log(`rejecting __bridgeFunctionPromise ${id}`)
      promise.reject(error)
    } else {
      // console.log(`resolving __bridgeFunctionPromise ${id}`)
      promise.resolve(result)
    }
  }
  window.addEventListener(
    SketchBridgeFunctionResultEvent,
    window.__bridgeFunctionResultEventListener
  )
}

export default function bridgedFunctionCall (functionName) {
  const promiseId = uuid()
  // console.log(`creating bridge function ${functionName} with id ${promiseId}`)
  return function () {
    return new Promise(function (resolve, reject) {
      bridgeFunctionPromises[promiseId] = {resolve, reject}
      pluginCall(SketchBridgeFunctionName, promiseId, functionName, ...arguments)
    })
  }
}

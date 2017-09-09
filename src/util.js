/*
 * CocoaScript utility functions.
 */

import { trace } from './logger'
import { readFile } from 'sketch-module-fs'

/**
 * Execute a function, but don't crash Sketch if it throws. This excellent
 * pattern borrowed from the Git Sketch plugin.
 *
 * @param {Object} context provided by Sketch
 * @param {function} func a function to execute
 */
export function executeSafely (context, func) {
  try {
    func(context)
  } catch (e) {
    createFailAlert(context, 'Error', e)
  }
}

/**
 * An async variant of `executeSafely`.
 *
 * @param {Object} context provided by Sketch
 * @param {function} func a function to execute
 */
export async function executeSafelyAsync (context, func) {
  try {
    await func(context)
  } catch (e) {
    createFailAlert(context, 'Error', e)
  }
}

/**
 * Create a modal error dialog.
 * @param {*} context provided by Sketch
 * @param {*} title a title for
 * @param {*} e the error message
 */
export function createFailAlert (context, title, error) {
  trace(error)
  const alert = NSAlert.alloc().init()
  alert.informativeText = '' + error
  alert.messageText = title
  alert.addButtonWithTitle('OK')
  alert.runModal()
}

/**
 * Open a URL in the user's default browser.
 *
 * @param {string} urlString a valid url
 */
export function openInBrowser (urlString) {
  if (!urlString || !urlString.trim()) {
    throw new Error('Can\'t open blank url!')
  }
  var url = NSURL.URLWithString(urlString)
  NSWorkspace.sharedWorkspace().openURL(url)
}

/**
 * Open a file in the user's default app for that file type.
 *
 * @param {string} filepath the path to a file
 */
export function openInDefaultApp (filepath) {
  return NSWorkspace.sharedWorkspace().openFile(filepath)
}

/**
 * Create a temp directory.
 *
 * @param {string} [name] an optional name for the directory
 * @return {string} the path to the temp directory
 */
export function tempDir (name) {
  var tmp = NSTemporaryDirectory() + 'jira-sketch-plugin/'
  if (name) {
    tmp += name + '/'
  }
  return tmp
}

/**
 * @param {number} max the maximum value
 * @return {string} a random hex string
 */
export function randomHex (max) {
  return randomInt(max).toString(16)
}

/**
 * @param {number} max the maximum value
 * @return {number} a random integer
 */
export function randomInt (max) {
  return Math.floor(Math.random() * max)
}

/**
 * @return {string} the user's Downloads directory, or a temp directory if no
 * Downloads directory coul be determined.
 */
export function userDownloadsDirectory () {
  var dirs = fileManager().URLsForDirectory_inDomains_(
    NSDownloadsDirectory,
    NSUserDomainMask
  )
  if (dirs.length) {
    return dirs[0].path()
  } else {
    return tempDir('downloads')
  }
}

/**
 * @param {string} path the path to a file
 * @return {Object} the file's attributes
 * @see https://developer.apple.com/documentation/foundation/nsfilemanager/1410452-attributesofitematpath?language=objc
 */
export function fileAttributes (path) {
  return withErrorPointer(errorPtr => {
    return fileManager().attributesOfItemAtPath_error(path, errorPtr)
  })
}

/**
 * @return the default NSFileManager
 * @see https://developer.apple.com/documentation/foundation/nsfilemanager
 */
function fileManager () {
  return NSFileManager.defaultManager()
}

/**
 * Helper function for dealing with Cocoa methods that use pointers.
 *
 * @param {funtion} fn a function to be invoked with a single MOPointer
 * instance. If the MOPointer has a value set after the funciton completes,
 * the value is thrown as an error.
 */
export function withErrorPointer (fn) {
  const errorPtr = MOPointer.alloc().init()
  const result = fn(errorPtr)
  const error = errorPtr.value()
  if (error) {
    trace(error)
    throw new Error(error)
  }
  return result
}

/**
 * @param {number} delay duration in milliseconds
 * @return {Promise} a Promise that resolves after the specified delay
 */
export function sleep (delay) {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay)
  })
}

/**
 * @param {function} fn the function to retry until an exception is not thrown
 * @param {number} maxRetries the number of times to retry (0 == unlimited retries)
 * @param {number} delay the delay to wait between retries
 * @return {*} the result of the function
 * @throws if the function throws more than maxRetries
 */
export async function retryUntilReturn (fn, maxRetries, delay) {
  while (true) {
    try {
      return await fn()
    } catch (e) {
      if (maxRetries) {
        if (--maxRetries) {
          await sleep(delay)
        } else {
          throw e
        }
      }
    }
  }
}

/**
 * @param {function} fn the function to retry until it returns a truthy result
 * @param {number} maxRetries the number of times to retry (0 == unlimited retries)
 * @param {number} delay the delay to wait between retries
 * @return {*} the result of the function
 */
export async function retryUntilTruthy (fn, maxRetries, delay) {
  while (true) {
    const result = await fn()
    if (result) {
      return result
    }
    if (maxRetries) {
      if (--maxRetries <= 0) {
        return result
      }
    }
    await sleep(delay)
  }
}

/**
 * @returns {string} the path to the plugin's /Resources directory
 */
export function resourcesPath () {
  return basePath() + '/Resources/'
}

/**
 * @returns {string} the path to the plugin's /Sketch directory
 */
export function scriptsPath () {
  return basePath() + '/Sketch/'
}

/**
 * @returns {string} the path to the plugin's /Contents directory
 */
function basePath () {
  return COScript.currentCOScript().env()
    .scriptURL.path()
    .stringByDeletingLastPathComponent()
    .stringByDeletingLastPathComponent()
}

/**
 * @param {string} path the path to a JSON file
 * @return {object} a JSON representation of the file
 */
export function readFileAsJson (path) {
  return JSON.parse(readFile(path, NSUTF8StringEncoding) + '')
}

/**
 * @param {string} localPath a path to a local file
 * @return {string} a normalized & URI encoded path to the specified file
 */

export function localPathToNSURLString (localPath) {
  return encodeURI(NSURL.fileURLWithPath(localPath).path() + '')
}

/**
 * @param {object} context provided by Sketch
 * @return {object} the currently selected document
 */
export function documentFromContext (context) {
  return context.document || (context.actionContext && context.actionContext.document) || null
}

export function pluralize (n, singular, plural) {
  return n == 1 ? singular : plural
}

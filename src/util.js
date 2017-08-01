import { tempDirName } from './config'
import { trace } from './logger'

export function setIconForAlert (context, alert) {
  alert.setIcon(
    NSImage.alloc().initWithContentsOfFile(
      context.plugin.urlForResourceNamed('jira.png').path()
    )
  )
}

export function executeSafely (context, func) {
  try {
    func(context)
  } catch (e) {
    createFailAlert(context, 'Error', e)
  }
}

export async function executeSafelyAsync (context, func) {
  try {
    await func(context)
  } catch (e) {
    createFailAlert(context, 'Error', e)
  }
}

export function createFailAlert (context, title, error) {
  console.log(error)
  var alert = NSAlert.alloc().init()
  alert.informativeText = '' + error
  alert.messageText = title
  alert.addButtonWithTitle('OK')
  setIconForAlert(context, alert)

  var responseCode = alert.runModal()

  return {
    responseCode
  }
}

export function openInBrowser (urlString) {
  var url = NSURL.URLWithString(urlString)
  NSWorkspace.sharedWorkspace().openURL(url)
}

export function openInDefaultApp (filepath) {
  return NSWorkspace.sharedWorkspace().openFile(filepath)
}

export function tempDir (name) {
  var tmp = NSTemporaryDirectory() + tempDirName + '/'
  if (name) {
    tmp += name + '/'
  }
  return tmp
}

export function extractFilenameFromPath (path) {
  var slashIndex = path.lastIndexOf('/')
  if (slashIndex == path.length - 1) {
    throw new Error(`Expected file path but received: ${path}`)
  } else if (slashIndex > -1) {
    return path.substring(slashIndex + 1)
  } else {
    return path
  }
}

export function normalizeFilepath (path) {
  // TODO there's probably a better way to do this
  // NSURL.path() ?
  if (path.indexOf('file://') == 0) {
    path = path.substring('file://'.length)
    path = decodeURIComponent(path)
  }
  return path
}

export function randomHex (max) {
  return randomInt(max).toString(16)
}

export function randomInt (max) {
  return Math.floor(Math.random() * max)
}

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

export function fileAttributes (path) {
  return withErrorPointer(errorPtr => {
    return fileManager().attributesOfItemAtPath_error(path, errorPtr)
  })
}

function fileManager () {
  return NSFileManager.defaultManager()
}

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

export function sleep (delay) {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay)
  })
}

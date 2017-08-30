import { trace } from './logger'

/**
 * Get paths for exported layers or other files that the user has just dragged.
 *
 * @return {string[]} an array of file urls from the system drag pasteboard.
 */
export function getDraggedFiles () {
  var pboard = NSPasteboard.pasteboardWithName(NSDragPboard)
  var items = pboard.pasteboardItems()
  var files = []
  for (var i = 0; i < items.count(); i++) {
    var item = items[i]
    // accept any dragged type that declares a file-url
    var fileUrl = item.stringForType('public.file-url')
    if (fileUrl) {
      files.push(fileUrl)
    }
  }
  trace(`File urls from pasteboard: ["${files.join('", "')}"]`)
  return files
}

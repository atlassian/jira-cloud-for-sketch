import MochaJSDelegate from './mocha-js-delegate'
import { executeSafely } from './util'

export default function (context, droppedFileCallback) {
  return new MochaJSDelegate({
    'webView:willPerformDragDestinationAction:forDraggingInfo:' (webView) {
      executeSafely(context, function () {
        // This objective-c function is usually passed an action and
        // draggingInfo, but declaring it as such causes Sketch to crash for a
        // reason I've yet to determine. Instead, we look up the dragged items
        // from the system drag pasteboard directly.
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
        droppedFileCallback(files)
      })
    }
  })
}

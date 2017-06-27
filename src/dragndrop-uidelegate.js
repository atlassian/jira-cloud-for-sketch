import ObjCClass from 'cocoascript-class'
import { executeSafely } from './util'

export default function (context, droppedFileCallback) {
  return new ObjCClass({
    'webView:willPerformDragDestinationAction:forDraggingInfo:' (webView) {
      executeSafely(context, function () {
        var pboard = NSPasteboard.pasteboardWithName(NSDragPboard)
        var items = pboard.pasteboardItems()
        var files = []
        for (var i = 0; i < items.count(); i++) {
          var item = items[i]
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

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
  return files
}

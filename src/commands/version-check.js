function isSupportedMacOSVersion () {
  try {
    return NSAppKitVersionNumber >= NSAppKitVersionNumber10_12
  } catch (e) {
    return false
  }
}

export default function () {
  log('Checking macOS version...')
  if (!isSupportedMacOSVersion()) {
    var alert = NSAlert.alloc().init()
    alert.messageText = 'Unsupported macOS version'
    alert.informativeText =
      'Sorry mate! JIRA Cloud for Sketch requires ' +
      'macOS v10.12 (Sierra) or newer.\n\n' +
      'See https://www.apple.com/macos/how-to-upgrade/' +
      'for instructions on how to upgrade.'
    alert.addButtonWithTitle('OK')
    alert.runModal()
  }
}

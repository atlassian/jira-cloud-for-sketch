export function setIconForAlert (context, alert) {
  alert.setIcon(NSImage.alloc().initWithContentsOfFile(
    context.plugin.urlForResourceNamed('jira.png').path()))
}

export function executeSafely (context, func) {
  try {
    func(context)
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

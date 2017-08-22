import '../default-imports'
import { executeSafelyAsync, createFailAlert } from '../util'
import { error, trace } from '../logger'

export default async function (context) {
  var coscript = COScript.currentCOScript()
  coscript.setShouldKeepAround(true)

  executeSafelyAsync(context, function () {
    const document = context.document || (context.actionContext && context.actionContext.document)
    if (!document) {
      return
    }
    const contentView = document.documentWindow().contentView()
    if (!contentView) {
      return
    }

    // Assumption: the NSView subclass for exports is named 'MSExportStackView'
    const exportStackView = findSubviewWithClass(contentView, 'MSExportStackView')
    if (!exportStackView) {
      error('Couldn\'t find MSExportStackView')
      return
    }

    // Assumption: No subviews for 'MSExportStackView' the selection can't be exported (?)
    const exportSubviews = exportStackView.subviews()
    if (exportSubviews.length == 0) {
      trace('MSExportStackView has no subviews')
      return
    }

    // Assumption: Export button bar is always the last subview of 'MSExportStackView'
    const exportButtonBar = exportSubviews[exportSubviews.length - 1]
    const exportButtons = exportButtonBar.subviews()

    // Assumption: There are two standard export buttons (plus ours)
    if (exportButtons.length == 3) {
      // button already registered \o/
      return
    }

    // Assumption: There are two standard export buttons
    // Assumption: If they aren't present, the layer is probably collapsed.
    if (exportButtons.length != 2) {
      trace(`Last subview MSExportStackView has ${exportButtons.length} subviews`)
      return
    }

    // Assumption: The first export button title is 'Export $layerName'
    // Assumption: Sketch is not internationalized (verify!)
    const exportButton = exportButtons[0]
    const title = exportButton.title && exportButton.title()
    if (!title || title.indexOf('Export ') != 0) {
      trace(`Possible export button has title: ${title}`)
      return
    }

    // Add the JIRA button
    const uploadIcon = NSImage.alloc().initWithContentsOfFile(
      context.plugin.urlForResourceNamed('upload-icon.png').path()
    )
    const jiraButton = NSButton.buttonWithImage_target_action(uploadIcon, null, null)
    jiraButton.setCOSJSTargetFunction(function (sender) {
      trace('JIRA button pressed!')
      createFailAlert(context, 'It worked', 'Sweet as')
    })

    exportButtonBar.addSubview(jiraButton)
    jiraButton.setFrame(NSMakeRect(110, -2, 56, 32))

    // Adjust the sizing of the 'Export $layerName' button to make room for the JIRA button
    // Assumption: The first subview is the 'Export $layerName' button
    const eFrame = exportButton.frame()
    exportButton.setFrame(NSMakeRect(
        eFrame.origin.x,
        eFrame.origin.y,
        eFrame.size.width - 44,
        eFrame.size.height
    ))
  })
}

function findSubviewWithClass (view, clazz) {
  if (view.class() == clazz) {
    return view
  }
  if (view.subviews) {
    const subviews = view.subviews()
    // Assumption: the Export panel is in the bottom right, so let's walk the tree
    // backwards to find it
    for (var i = subviews.length - 1; i >= 0; i--) {
      const result = findSubviewWithClass(subviews[i], clazz)
      if (result) {
        return result
      }
    }
  }
  return null
}

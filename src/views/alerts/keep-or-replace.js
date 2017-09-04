import { pluralize } from '../../util'

export const Replace = 'replace'
export const Keep = 'keep'
export const Cancel = 'cancel'

/**
 * Displays an alert prompting the user to Keep or Replace pre-existing Jira
 * attachments with names identical to the exported layers.
 * @param {Object} context provided by Sketch
 * @param {string} issueKey the issue being exported to
 * @param {string[]} matchingImages the identical image filenames
 */
export default function (context, issueKey, matchingImages) {
  const matches = matchingImages.length
  const alert = NSAlert.alloc().init()
  alert.informativeText = pluralize(matches,
    `An image named '${matchingImages[0]}' is already attached to ${issueKey}`,
    `${issueKey} already has ${matches} attachments with names matching your exports`
  )
  alert.messageText = `Keep or replace existing ${pluralize(matches, 'attachment', 'attachments')}`
  alert.addButtonWithTitle(pluralize(matches, 'Replace', 'Replace All'))
  alert.addButtonWithTitle(`Keep ${pluralize(matches, 'Both', 'All')}`)
  alert.setIcon(
    NSImage.alloc().initWithContentsOfFile(
      context.plugin.urlForResourceNamed('upload-alert.png').path()
    )
  )
  const responseCode = alert.runModal()
  if (responseCode == NSAlertFirstButtonReturn) {
    return Replace
  } else if (responseCode == NSAlertSecondButtonReturn) {
    return Keep
  } else {
    return Cancel
  }
}

/*
 * Utilities for sharing state across plugin command and action invocations.
 *
 * TODO: introduce a cross-context event system?
 */

const keys = {
  selectedIssueKey: 'selectedIssueKey'
}

const dictionaryKey = 'jira-sketch-plugin-state'

/**
 * A shared object that is shared across CocoaScript contexts by storing to and
 * retrieving from the main thread's thread dictionary.
 */
const pluginState = (function () {
  let _state = NSThread.mainThread().threadDictionary()[dictionaryKey]
  if (!_state) {
    _state = NSMutableDictionary.alloc().init()
    NSThread.mainThread().threadDictionary()[dictionaryKey] = _state
  }
  return _state
})()

/**
 * Determine if the Jira panel is open and an issue is selected.
 *
 * @return {string} the currently selected issue, or null if no issue is selected
 */
export function getSelectedIssueKey () {
  const issueKey = pluginState[keys.selectedIssueKey]
  return issueKey ? issueKey + '' : null // convert to JS string
}

/**
 * Set the currently selected issue.
 *
 * @param {string} key the currently selected issue
 */
export function setSelectedIssueKey (key) {
  pluginState[keys.selectedIssueKey] = key
}

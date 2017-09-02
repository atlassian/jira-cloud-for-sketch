/*
 * Utilities for sharing state across plugin command and action invocations.
 *
 * TODO: introduce a cross-context event system?
 */

const keys = {
  selectedIssueKey: 'selectedIssueKey',
  exportSelectedLayersFn: 'exportSelectedLayersFn',
  onSelectionChangedFn: 'onSelectionChangedFn'
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
 * Determine if the JIRA panel is open and an issue is selected.
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

/**
 * Trigger an export of the user's currently selected layers.
 *
 * @return {boolean} whether an export trigger function was set
 */
export function triggerExportSelectedLayers () {
  return triggerFunction(keys.exportSelectedLayersFn)
}

/**
 * Set the trigger function used by `triggerExportSelectedLayers`.
 *
 * @param {function} fn a function that, when invoked, exports the user's
 * currently selected layers
 */
export function setExportSelectedLayersFn (fn) {
  pluginState[keys.exportSelectedLayersFn] = fn
}

/**
 * Trigger the onSelectionChanged function. Used to notify across plugin
 * contexts that the user's selection may have changed.
 *
 * @return {boolean} whether an onSelectionChanged function was set
 */
export function triggerOnSelectionChanged () {
  return triggerFunction(keys.onSelectionChangedFn)
}

/**
 * Set the trigger function used by `triggerOnSelectionChanged`.
 *
 * @param {function} fn a function that, when invoked, exports the user's
 * currently selected layers
 */
export function setOnSelectionChangedFn (fn) {
  pluginState[keys.onSelectionChangedFn] = fn
}

/**
 * @param {string} key a plugin state key corresponding to a function
 * @return {boolean} true if the specified function exists
 */
function triggerFunction (key) {
  const fn = pluginState[key]
  if (fn) {
    fn()
    return true
  } else {
    return false
  }
}
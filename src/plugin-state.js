const keys = {
  selectedIssueKey: 'selectedIssueKey',
  exportSelectedLayersFn: 'exportSelectedLayersFn'
}

const dictionaryKey = 'jira-sketch-plugin-state'

const pluginState = (function () {
  let _state = NSThread.mainThread().threadDictionary()[dictionaryKey]
  if (!_state) {
    _state = NSMutableDictionary.alloc().init()
    NSThread.mainThread().threadDictionary()[dictionaryKey] = _state
  }
  return _state
})()

export function getSelectedIssueKey () {
  const issueKey = pluginState[keys.selectedIssueKey]
  return issueKey ? issueKey + '' : null // convert to JS string
}

export function setSelectedIssueKey (key) {
  pluginState[keys.selectedIssueKey] = key
}

export function triggerExportSelectedLayers () {
  const fn = pluginState[keys.exportSelectedLayersFn]
  if (fn) {
    fn()
    return true
  } else {
    return false
  }
}

export function setExportSelectedLayersFn (fn) {
  pluginState[keys.exportSelectedLayersFn] = fn
}

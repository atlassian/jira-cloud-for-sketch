export const keys = {
  selectedIssue: 'selectedIssue',
  uploads: 'uploads'
}

const dictionaryKey = 'atlassian-sketch-plugin-state'

const pluginState = (function () {
  let _state = NSThread.mainThread().threadDictionary()[dictionaryKey]
  if (!_state) {
    _state = NSMutableDictionary.alloc().init()
    NSThread.mainThread().threadDictionary()[dictionaryKey] = _state
  }
  return _state
})()

export default pluginState

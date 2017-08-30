import ObjCClass from 'cocoascript-class'

const DelegateClass = ObjCClass({
  classname: 'AtlassianNSPanelDelegate',
  callbacks: null,
  'windowWillClose:': function (notification) {
    this.callbacks.onClose()
  }
})

/**
 * @param {Object} callbacks callbacks supported by this delegate
 * @param {function} callbacks.onClose invoked when the delegate's
 * `windowWillClose:` selector is invoked
 * @return a delegate suitable for use as an NSWindowDelegate
 */
export default function (callbacks) {
  const delegate = DelegateClass.new()
  delegate.callbacks = NSDictionary.dictionaryWithDictionary(callbacks)
  return delegate
}

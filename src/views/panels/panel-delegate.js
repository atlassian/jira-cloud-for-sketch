import ObjCClass from 'cocoascript-class'

const DelegateClass = ObjCClass({
  classname: 'AtlassianNSPanelDelegate',
  callbacks: null,
  'windowWillClose:': function (notification) {
    this.callbacks.onClose()
  }
})

export default function (callbacks) {
  const delegate = DelegateClass.new()
  delegate.callbacks = NSDictionary.dictionaryWithDictionary(callbacks)
  return delegate
}

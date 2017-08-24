import ObjCClass from 'cocoascript-class'

export const onClickSelector = NSSelectorFromString('onClick:')

const DelegateClass = ObjCClass({
  classname: 'AtlassianNSButtonDelegate',
  callbacks: null,
  'onClick:': function (sender) {
    this.callbacks.onClick()
  }
})

export default function (callbacks) {
  const delegate = DelegateClass.new()
  delegate.callbacks = NSDictionary.dictionaryWithDictionary(callbacks)
  return delegate
}

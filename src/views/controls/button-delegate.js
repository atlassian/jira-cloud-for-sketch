import ObjCClass from 'cocoascript-class'

export const onClickSelector = NSSelectorFromString('onClick:')

const DelegateClass = ObjCClass({
  classname: 'AtlassianNSButtonDelegate',
  callbacks: null,
  'onClick:': function (sender) {
    this.callbacks.onClick()
  }
})

/**
 * @param {Object} callbacks callbacks supported by this delegate
 * @param {function} callbacks.onClick invoked when the delegate's onClick:
 * selector is invoked
 * @return a delegate suitable for using as the target of an NSButton
 */
export default function (callbacks) {
  const delegate = DelegateClass.new()
  delegate.callbacks = NSDictionary.dictionaryWithDictionary(callbacks)
  return delegate
}

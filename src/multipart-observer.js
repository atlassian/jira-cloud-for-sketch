import ObjCClass from 'cocoascript-class'
import { trace } from './logger'

export default function (callbacks) {
  return new ObjCClass({
    'taskDidTerminate:' (notification) {
      trace('taskDidTerminate')
      callbacks.taskDidTerminate && callbacks.taskDidTerminate()
    },
    'fileHandleReadToEndOfFileCompletion:' (notification) {
      trace('fileHandleReadToEndOfFileCompletion')
      callbacks.fileHandleReadToEndOfFileCompletion &&
        callbacks.fileHandleReadToEndOfFileCompletion()
    }
  })
}

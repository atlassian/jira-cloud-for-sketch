import ObjCClass from 'cocoascript-class'
import { noop } from 'lodash'
import { trace } from './logger'

var DelegateClass

export default async function upload (url, filePath, opts) {
  if (!opts.filename || !opts.mimeType) {
    throw new Error('Must specify filename & mimeType to upload')
  }

  // var fileUrl = NSURL.fileURLWithPath(filePath)
  var serializer = AFHTTPRequestSerializer.alloc().init()
  var request = serializer.requestWithMethod_URLString_parameters_error('POST', url, null, null)

  // next thing to try -- subclass NSInputStream and use
    // appendPartWithInputStream:name:fileName:length:mimeType:
  // to report on progress

  Object.keys(opts.headers || {}).forEach(function (i) {
    request.setValue_forHTTPHeaderField(opts.headers[i], i)
  })

  var fileError = MOPointer.alloc().init()
  var fileAttributes = NSFileManager.defaultManager().attributesOfItemAtPath_error(filePath, fileError)
  var inputLength = fileAttributes.fileSize()

  var inputStream = NSInputStream.inputStreamWithFileAtPath(filePath)

  // sniff mimetype from fileAttributes.fileType() ?

  var formData = AFStreamingMultipartFormData.alloc().initWithURLRequest_stringEncoding(request, NSUTF8StringEncoding)

  // var error = MOPointer.alloc().init()
  // formData.appendPartWithFileURL_name_error(fileUrl, 'file', error)
  // error = error.value()
  // if (error) {
  //   trace(error)
  //   throw error
  // }

  formData.appendPartWithInputStream_name_fileName_length_mimeType(
    inputStream,
    'file',
    opts.filename,
    inputLength,
    opts.mimeType
  )

  var finalizedRequest = formData.requestByFinalizingMultipartFormData()

  if (!DelegateClass) {
    DelegateClass = ObjCClass({
      classname: 'UploadDelegate',
      data: null,
      callbacks: null,
      'connectionDidFinishLoading:': function (connection) {
        return this.callbacks.resolve(dataHandler(this.data))
      },
      'connection:didReceiveResponse:': function (connection, httpResponse) {
        this.data = NSMutableData.alloc().init()
      },
      'connection:didSendBodyData:totalBytesWritten:totalBytesExpectedToWrite:':
        function (connection /*, bytesWritten, totalBytesWritten, totalBytesExpectedToWrite */) {
          // including any of these arguments here causes Sketch to crash! :(
        },
      'connection:didFailWithError:': function (connection, error) {
        return this.callbacks.reject(error)
      },
      'connection:didReceiveData:': function (connection, data) {
        this.data.appendData(data)
      }
    })
  }

  var connectionDelegate = DelegateClass.new()
  var progress = opts.progress || noop
  return new Promise(function (resolve, reject) {
    connectionDelegate.callbacks = NSDictionary.dictionaryWithDictionary({
      resolve, reject, progress
    })
    NSURLConnection.alloc().initWithRequest_delegate(finalizedRequest, connectionDelegate)
  })
}

// based on the excellent sketch-module-fetch-polyfill
function dataHandler (data) {
  return {
    text: function () {
      return new Promise(function (resolve, reject) {
        const str = NSString.alloc().initWithData_encoding(data, NSASCIIStringEncoding)
        if (str) {
          resolve(str)
        } else {
          reject(new Error("Couldn't parse body"))
        }
      })
    },
    json: function () {
      return new Promise(function (resolve, reject) {
        var str = NSString.alloc().initWithData_encoding(data, NSUTF8StringEncoding)
        if (str) {
          // parse errors are turned into exceptions, which cause promise to be rejected
          var obj = JSON.parse(str)
          resolve(obj)
        } else {
          reject(new Error('Could not parse JSON because it is not valid UTF-8 data.'))
        }
      })
    },
    blob: function () {
      return Promise.resolve(data)
    }
  }
}

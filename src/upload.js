import ObjCClass from 'cocoascript-class'
import { trace } from './logger'

var DelegateClass

export default async function upload (url, filePath, opts) {
  if (!opts.filename) {
    throw new Error('Must specify filename to upload')
  }

  var fileUrl = NSURL.fileURLWithPath(filePath)
  var serializer = AFHTTPRequestSerializer.alloc().init()
  var request = serializer.requestWithMethod_URLString_parameters_error('POST', url, null, null)

  Object.keys(opts.headers || {}).forEach(function (i) {
    request.setValue_forHTTPHeaderField(opts.headers[i], i)
  })

  var formData = AFStreamingMultipartFormData.alloc().initWithURLRequest_stringEncoding(request, NSUTF8StringEncoding)
  var error = MOPointer.alloc().init()
  formData.appendPartWithFileURL_name_error(fileUrl, 'file', error)
  error = error.value()
  if (error) {
    trace(error)
    throw error
  }
  var finalizedRequest = formData.requestByFinalizingMultipartFormData()

  if (!DelegateClass) {
    DelegateClass = ObjCClass({
      classname: 'UploadDelegate',
      data: null,
      httpResponse: null,
      callbacks: null,
      'connectionDidFinishLoading:': function (connection) {
        return this.callbacks.resolve(dataHandler(this.data))
      },
      'connection:didReceiveResponse:': function (connection, httpResponse) {
        this.httpResponse = httpResponse
        this.data = NSMutableData.alloc().init()
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
  return new Promise(function (resolve, reject) {
    connectionDelegate.callbacks = NSDictionary.dictionaryWithDictionary({
      resolve,
      reject
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

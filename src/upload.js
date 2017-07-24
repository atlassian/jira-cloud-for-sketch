import { assign } from 'lodash'
import { trace } from './logger'

export default async function upload (url, opts) {
  if (!opts.filePath) {
    throw new Error('opts.filePath is required')
  }
  opts = assign({}, opts, {
    method: 'POST',
    parameterName: 'file'
  })
  const serializer = AFHTTPRequestSerializer.alloc().init()
  const request = serializer.requestWithMethod_URLString_parameters_error(opts.method, url, null, null)

  // request headers
  Object.keys(opts.headers || {}).forEach(function (i) {
    request.setValue_forHTTPHeaderField(opts.headers[i], i)
  })

  // request body
  var fileUrl = NSURL.fileURLWithPath(opts.filePath)
  var formData = AFStreamingMultipartFormData.alloc().initWithURLRequest_stringEncoding(request, NSUTF8StringEncoding)
  var error = MOPointer.alloc().init()
  formData.appendPartWithFileURL_name_error(fileUrl, opts.parameterName, error)
  error = error.value()
  if (error) {
    trace(error)
    throw new Error(error.value())
  }
  var finalizedRequest = formData.requestByFinalizingMultipartFormData()

  var delegate = AtlassianURLConnectionDelegate.alloc().init()
  NSURLConnection.alloc().initWithRequest_delegate(finalizedRequest, delegate)

  return new Promise(function (resolve, reject) {
    /**
     * Why are we _polling_ the delegate state to determine the progress of the
     * request?! This is admittedly not great, but polling is actually Plan D,
     * implemented only after plans A through C failed spectacularly:
     *
     * Plan A was to implement an NSURLConnectionDelegate delegate using
     * `cocoascript-class` (similar to the approach taken by
     * `sketch-module-fetch-polyfill`). However, Sketch would crash when the
     * connection:didSendBodyData:totalBytesWritten:totalBytesExpectedToWrite:
     * selector was invoked, I suspect due to a problem with the way
     * Objective-C's NSInteger is bridged.
     *
     * Plan B was to write a pure Objective-C delegate that wrapped a simpler
     * Mocha-friendly delegate that passed NSString to a similar
     * `connection:didSendBodyData...` selector, but the wrapped delegate would
     * cause Sketch to crash intermittently with a segmentation fault, possibly
     * due to an unresolved Mocha issue[0] (though the problem may lie
     * elsewhere - without access to the Sketch/Foundation source it's hard to
     * tell exactly what the problem was).
     *
     * Plan C was `AFStreamingMultipartFormData.appendPartWithInputStream...`
     * with a subclassed NSInputStream to monitor how many bytes were written,
     * but it turns out subclassing NSInputStream for use with an NSURLRequest
     * is non-trivial[1].
     *
     * Which leaves us with Plan D: polling a pure Objective-C delegate. This
     * is pretty far from ideal, but works reliably and, most importantly,
     * doesn't crash Sketch!
     *
     * [0]: https://github.com/logancollins/Mocha/issues/26
     * [1]: http://blog.bjhomer.com/2011/04/subclassing-nsinputstream.html
     */
    var id = setInterval(function () {
      if (delegate.failed()) {
        clearInterval(id)
        trace(`error: ${delegate.error()}`)
        reject(delegate.error())
      } else if (delegate.completed()) {
        clearInterval(id)
        trace(`error: ${delegate.error()}`)
        resolve(dataHandler(delegate.data()))
      } else {
        if (opts.progress) {
          let progress = delegate.progress()
          opts.progress(progress.completedUnitCount(), progress.totalUnitCount())
        }
      }
    }, 200)
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

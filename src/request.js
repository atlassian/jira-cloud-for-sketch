import { assign } from 'lodash'
import { cocoaDelegatePollInterval } from './config'
import { userDownloadsDirectory, withErrorPointer } from './util'
import { trace, isTraceEnabled } from './logger'

export async function download (url, opts, onProgress) {
  opts = assign({}, { method: 'GET' }, opts)
  if (opts.filename) {
    opts.filePath = userDownloadsDirectory() + '/' + opts.filename
  } else if (!opts.filePath) {
    throw new Error('opts.filename or opts.filePath is required')
  }
  const request = createRequest(url, opts)
  const delegate = AtlassianURLDownloadDelegate.alloc().init()
  const urlDownload = NSURLDownload.alloc().initWithRequest_delegate(request, delegate)
  urlDownload.setDestination_allowOverwrite(opts.filePath, false)
  await pollDelegateUntilComplete(delegate, onProgress)
  return delegate.filePath()
}

export async function upload (url, opts, onProgress) {
  if (!opts.filePath) {
    throw new Error('opts.filePath is required')
  }
  opts = assign({}, opts, {
    method: 'POST',
    parameterName: 'file'
  })
  const request = addFileAsMultipartRequestBody(
    createRequest(url, opts),
    opts.parameterName,
    opts.filePath
  )
  const delegate = AtlassianURLConnectionDelegate.alloc().init()
  NSURLConnection.alloc().initWithRequest_delegate(request, delegate)
  await pollDelegateUntilComplete(delegate, onProgress)
  return dataParserWrapper(delegate.data())
}

function createRequest (url, opts) {
  if (isTraceEnabled()) {
    trace(`creating request\n  url: ${url}\n  opts: ${JSON.stringify(opts)}`)
  }
  const serializer = AFHTTPRequestSerializer.alloc().init()
  const request = withErrorPointer(errorPtr =>
    serializer.requestWithMethod_URLString_parameters_error(
      opts.method,
      url,
      null,
      errorPtr
    )
  )
  Object.keys(opts.headers || {}).forEach(function (i) {
    request.setValue_forHTTPHeaderField(opts.headers[i], i)
  })
  return request
}

function addFileAsMultipartRequestBody (request, parameterName, filePath) {
  var fileUrl = NSURL.fileURLWithPath(filePath)
  var formData = AFStreamingMultipartFormData
    .alloc()
    .initWithURLRequest_stringEncoding(request, NSUTF8StringEncoding)
  withErrorPointer(errorPtr =>
    formData.appendPartWithFileURL_name_error(fileUrl, parameterName, errorPtr)
  )
  return formData.requestByFinalizingMultipartFormData()
}

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
async function pollDelegateUntilComplete (delegate, onProgress) {
  return new Promise(function (resolve, reject) {
    var id = setInterval(function () {
      if (delegate.failed()) {
        clearInterval(id)
        trace(`error: ${delegate.error()}`)
        reject(delegate.error())
      } else if (delegate.completed()) {
        clearInterval(id)
        resolve(delegate)
      } else {
        const progress = delegate.progress()
        if (isTraceEnabled()) {
          trace(`${progress.completedUnitCount()} / ${progress.totalUnitCount()} bytes`)
        }
        if (onProgress) {
          onProgress(
            parseInt(progress.completedUnitCount()),
            parseInt(progress.totalUnitCount())
          )
        }
      }
    }, cocoaDelegatePollInterval)
  })
}

// based on the excellent sketch-module-fetch-polyfill
function dataParserWrapper (data) {
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

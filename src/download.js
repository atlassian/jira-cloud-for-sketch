import ObjCClass from 'cocoascript-class'
import { assign } from 'lodash'
import { userDownloadsDirectory } from './util'
import { trace } from './logger'

var DelegateClass

export default async function download (url, opts) {
  if (!opts.filename) {
    throw new Error('Must specify filename to download')
  }
  coscript.setShouldKeepAround(true)
  opts = assign({}, {
    path: userDownloadsDirectory()
  }, opts)
  var filepath = opts.path + '/' + opts.filename
  var nsUrl = NSURL.alloc().initWithString(url)
  var request = NSMutableURLRequest.requestWithURL(nsUrl)
  request.setHTTPMethod('GET')

  Object.keys(opts.headers || {}).forEach(function (i) {
    request.setValue_forHTTPHeaderField(opts.headers[i], i)
  })

  if (!DelegateClass) {
    DelegateClass = ObjCClass({
      classname: 'DownloadDelegate',
      callbacks: null,
      downloadPath: null,
      'download:didCreateDestination:': function (download, path) {
        trace(`download:didCreateDestination: ${path}`)
        this.downloadPath = path
      },
      'downloadDidFinish:': function () {
        trace('downloadDidFinish:')
        return this.callbacks.resolve(this.downloadPath)
      },
      'download:didFailWithError:': function (download, error) {
        trace('download:didFailWithError:')
        return this.callbacks.reject(error)
      }
    })
  }
  var downloadDelegate = DelegateClass.new()
  return new Promise(function (resolve, reject) {
    downloadDelegate.callbacks = NSDictionary.dictionaryWithDictionary({
      resolve,
      reject
    })
    var urlDownload = NSURLDownload.alloc().initWithRequest_delegate(request, downloadDelegate)
    urlDownload.setDestination_allowOverwrite(filepath, false)
  })
}

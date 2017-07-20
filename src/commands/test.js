import '../defaultImports'
import { executeSafelyAsync } from '../util'
import { trace } from '../logger'
import upload from '../upload'

export default async function (context) {
  executeSafelyAsync(context, async function () {
    var coscript = COScript.currentCOScript()
    coscript.setShouldKeepAround(true)

    var obj = AtlassianSketchFramework.alloc().init()
    var uppercase = obj.uppercaseString('hello world')

    log(uppercase)
    context.document.showMessage(uppercase)

    // var data = await upload('https://file.io', 'file:///Users/tpettersen/tmp/sketch.png', {filename: 'sketch.png'})
    // var data = await upload(
    //   'https://file.io',
    //   '/Users/tpettersen/tmp/sketch.png', {
    //     filename: 'sketch.png',
    //     mimeType: 'image/png',
    //     progress: function (bytesWritten, totalBytesWritten, totalBytesExpectedToWrite) {
    //       trace(`wrote ${bytesWritten} bytes (${totalBytesWritten} of ${totalBytesExpectedToWrite}`)
    //     }
    //   })
    // trace(await data.text())

    // var file = await download('https://tpettersen.bitbucket.io/sketch.png', {
    //   filename: 'sketch.png'
    // })
    // context.document.showMessage(`Downloaded ${file}`)

    // const configuration = NSURLSessionConfiguration.defaultSessionConfiguration()
    // const manager = AFURLSessionManager.alloc().initWithSessionConfiguration(configuration)

    // const url = NSURL.URLWithString('https://file.io')
    // const request = NSMutableURLRequest.requestWithURL(url)
    // request.setHTTPMethod('POST')

    // const filePath = NSURL.fileURLWithPath('file://Users/tpettersen/tmp/sketch.png')

    // THIS for uploads ??
    // ---> https://developer.apple.com/documentation/foundation/nsurlsession/1411638-uploadtaskwithrequest?language=objc

    // NSURLSession

    // var formData = AFStreamingMultipartFormData.alloc().initWithURLRequest_stringEncoding(request, NSUTF8StringEncoding)
    // formData.appendPartWithFileURL_name_error(filePath, 'sketch.png', null)

    // var finalizedRequest = formData.requestByFinalizingMultipartFormData()

    // var DelegateClass = ObjCClass({
    //   classname: 'UploadDelegate',
    //   data: null,
    //   httpResponse: null,
    //   callbacks: null,
    //   'connectionDidFinishLoading:': function (connection) {
    //     coscript.setShouldKeepAround(false)
    //     trace(this.httpResponse)
    //     const str = NSString.alloc().initWithData_encoding(this.data, NSASCIIStringEncoding)
    //     trace(str)
    //   },
    //   'connection:didReceiveResponse:': function (connection, httpResponse) {
    //     this.httpResponse = httpResponse
    //     this.data = NSMutableData.alloc().init()
    //   },
    //   'connection:didFailWithError:': function (connection, error) {
    //     coscript.setShouldKeepAround(false)
    //     trace(error)
    //   },
    //   'connection:didReceiveData:': function (connection, data) {
    //     this.data.appendData(data)
    //   }
    // })

    // var connectionDelegate = DelegateClass.new()
    // NSURLConnection.alloc().initWithRequest_delegate(finalizedRequest, connectionDelegate)
  })
}

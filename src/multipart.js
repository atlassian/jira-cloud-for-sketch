import { trace } from './logger'

export default function multipartPost (url, auth, filepath, filename) {
  var task = NSTask.alloc().init()

  /*
    What! Why are we forking cURL?

    Short answer:
    This is what other Sketch plugins do to make multipart HTTP requests.

    Long answer:
    Because the only real alternative is writing and maintaining our own
    multipart form handling in CocoaScript. The fetch polyfill we use
    elsewhere is incomplete, and has no support for multipart requests.
    This is likely because the underlying NSMutableURLRequest Cocoa class
    has no special handling for multipart requests, requiring users to
    either manually create their own multipart request bodies, or use an
    existing library. There is a MultipartDataBuilder library[0] but it's
    implemented in Swift, which we can't use without potentially causing
    future instability in our plugin[1].

    We could potentially write and maintain our own multipart form handling
    in the future[2] but translating that beast into CocoaScript correctly,
    testing all the edge cases, and ensuring we correctly handling encoding
    is not something I want to deal with right now.

    [0]: https://cocoapods.org/pods/MultipartDataBuilder
    [1]: http://sketchplugins.com/d/164-working-with-a-framework-using-swift/7
    [2]: http://nthn.me/posts/2012/objc-multipart-forms.html
  */
  task.setLaunchPath('/usr/bin/curl')

  var args = NSArray.arrayWithObjects(
    '-v',
    '-S',
    '-X', 'POST',
    '-H', 'X-Atlassian-Token: no-check',
    '-H', `Authorization: ${auth}`,
    '-F', `file=@${filepath};filename=${encodeFilename(filename)}`,
    url
  )

  trace('curl ' + args.join(' '))

  task.setArguments(args)

  // var outputPipe = [NSPipe pipe];
  var outputPipe = NSPipe.alloc().init()
  // [task setStandardOutput:outputPipe];
  task.setStandardOutput(outputPipe)
  task.launch()
  // var outputData = [[outputPipe fileHandleForReading] readDataToEndOfFile];
  var outputData = outputPipe.fileHandleForReading().readDataToEndOfFile()
  // var outputString = [[[NSString alloc] initWithData:outputData encoding:NSUTF8StringEncoding]];
  var outputString = NSString.alloc().initWithData_encoding_(
    outputData,
    NSUTF8StringEncoding
  )
  return outputString
}

// with respect to curl
function encodeFilename (filename) {
  // CocoaScript has issues with inline regexps containing square brackets
  // http://mail.sketchplugins.com/pipermail/dev_sketchplugins.com/2014-October/000734.html
  var badFilenameChars = new RegExp('[,;]', 'g')
  return filename.replace(badFilenameChars, '_')
}

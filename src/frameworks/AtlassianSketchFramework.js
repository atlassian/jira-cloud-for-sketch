import { trace } from '../logger'

var frameworkPath = COScript.currentCOScript().env()
    .scriptURL.path()
    .stringByDeletingLastPathComponent()
    .stringByDeletingLastPathComponent() + '/Resources/'

var mocha = Mocha.sharedRuntime()
var frameworkName = 'AtlassianSketchFramework'
if (mocha.valueForKey(frameworkName)) {
  trace(`😎 loadFramework: ${frameworkName} already loaded.`)
} else if (
  mocha.loadFrameworkWithName_inDirectory(frameworkName, frameworkPath)
) {
  trace(`✅ loadFramework: ${frameworkName} success!`)
  mocha.setValue_forKey_(true, frameworkName)
} else {
  trace(`❌ loadFramework: ${frameworkName} failed!`)
}

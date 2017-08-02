import { trace } from '../logger'
import { resourcesPath } from '../util'

var mocha = Mocha.sharedRuntime()
var frameworkName = 'AtlassianSketchFramework'
if (mocha.valueForKey(frameworkName)) {
  trace(`${frameworkName} already loaded.`)
} else if (
  mocha.loadFrameworkWithName_inDirectory(frameworkName, resourcesPath())
) {
  trace(`${frameworkName} loaded!`)
  mocha.setValue_forKey_(true, frameworkName)
} else {
  trace(`${frameworkName} failed to load!`)
}

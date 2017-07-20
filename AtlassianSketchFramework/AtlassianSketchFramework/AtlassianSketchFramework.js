/*
// To load this framework, replace the onRun method in your script.cocoscript

@import 'AtlassianSketchFramework.framework/AtlassianSketchFramework.js'

var onRun = function(context) {
   var obj = AtlassianSketchFramework.alloc().init()
   var uppercase = obj.uppercaseString("hello world")

   log(uppercase);
   context.document.showMessage(uppercase);
}
*/

var AtlassianSketchFramework_FrameworkPath = AtlassianSketchFramework_FrameworkPath || COScript.currentCOScript().env().scriptURL.path().stringByDeletingLastPathComponent();
var AtlassianSketchFramework_Log = AtlassianSketchFramework_Log || log;
(function() {
 var mocha = Mocha.sharedRuntime();
 var frameworkName = "AtlassianSketchFramework";
 var directory = AtlassianSketchFramework_FrameworkPath;
 if (mocha.valueForKey(frameworkName)) {
AtlassianSketchFramework_Log("😎 loadFramework: `" + frameworkName + "` already loaded.");
 return true;
 } else if ([mocha loadFrameworkWithName:frameworkName inDirectory:directory]) {
 AtlassianSketchFramework_Log("✅ loadFramework: `" + frameworkName + "` success!");
 mocha.setValue_forKey_(true, frameworkName);
 return true;
 } else {
 AtlassianSketchFramework_Log("❌ loadFramework: `" + frameworkName + "` failed!: " + directory + ". Please define AtlassianSketchFramework_FrameworkPath if you're trying to @import in a custom plugin");
 return false;
 }
 })();

import WebUI from 'sketch-module-web-view'
import { executeSafely } from './util'

export default function (context) {
  executeSafely(context, function() {      
    const webUI = new WebUI(context, 'issues.html', {
      identifier: 'jira-sketch-plugin.issues',
      height: 280,
      onlyShowCloseButton: true,
      hideTitleBar: false,
      handlers: {
        viewIssue (key) {
          executeSafely(context, function () {            
            var app = NSApp.delegate()
            app.refreshCurrentDocument()
            webUI.panel.close()
            context.document.showMessage(`Viewing issue '${key}'`)
          })
        },
        exportAssets (key) {
          executeSafely(context, function () {                        
            var app = NSApp.delegate()
            app.refreshCurrentDocument()
            webUI.panel.close()
            context.document.showMessage(`Exported assets to '${key}'`)
          })
        }
      }
    })
    context.document.showMessage('Launched issues webview')
    webUI.eval('window.issues=["SKIRA-1","JRA-1330"]')
    webUI.eval('window.ready=true')
    log("done eval")
  })
}

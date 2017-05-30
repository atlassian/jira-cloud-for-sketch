import WebUI from 'sketch-module-web-view'
import { executeSafely } from '../util'

export default function (context) {
  executeSafely(context, function() {      
    const webUI = new WebUI(context, 'issues.html', {
      identifier: 'jira-sketch-plugin.issues',
      height: 280,
      width: 600,
      onlyShowCloseButton: true,
      hideTitleBar: false,
      title: "Recent Issues",
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
    webUI.eval('window.issues=[' + 
        '{key:"SKIRA-1",summary:"Just do it",status:"Open",statusCategory:"new"},' + 
        '{key:"JRA-1330",summary:"Field level security",status:"Resolved",statusCategory:"done"},' + 
        '{key:"AC-12345",summary:"Atlassian Connect enhancements",status:"In Progress",statusCategory:"indeterminate"}' + 
      ']')
    webUI.eval('window.ready=true')
  })
}

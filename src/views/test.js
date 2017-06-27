import '../defaultImports'
import WebUI from 'sketch-module-web-view'
import { executeSafelyAsync } from '../util'
import DragUIDelegate from '../dragndrop-uidelegate'

export default function (context) {
  executeSafelyAsync(context, async function () {
    const webUI = new WebUI(context, 'drop.html', {
      identifier: 'jira-sketch-plugin.drop',
      height: 200,
      width: 200,
      onlyShowCloseButton: true,
      hideTitleBar: false,
      title: 'DropZone',
      handlers: {}
    })
    var uiDelegate = DragUIDelegate(context, console.log)
    webUI.webView.setUIDelegate_(uiDelegate.new())
    webUI.eval('window.ready=true')
  })
}

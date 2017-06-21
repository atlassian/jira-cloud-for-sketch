import '../defaultImports'
import WebUI from 'sketch-module-web-view'
import { executeSafelyAsync } from '../util'

export default function (context) {
  executeSafelyAsync(context, async function() {
    const webUI = new WebUI(context, 'drop.html', {
      identifier: 'jira-sketch-plugin.drop',
      height: 200,
      width: 200,
      onlyShowCloseButton: true,
      hideTitleBar: false,
      title: "DropZone",
      handlers: {}
    })
    webUI.eval('window.ready=true')
  })
}
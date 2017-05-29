import WebUI from 'sketch-module-web-view'

export default function (context) {
  context.document.showMessage('Launching connect webview')
  const webUI = new WebUI(context, 'connect.html', {
    identifier: 'jira-sketch-plugin.connect',
    height: 280,
    onlyShowCloseButton: true,
    hideTitleBar: true,
    handlers: {}
  })
  webUI.eval('window.ready=true')
}

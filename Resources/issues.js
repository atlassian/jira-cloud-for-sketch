import { h, render, Component } from 'preact'
import pluginCall from 'sketch-module-web-view/client'


class Issue extends Component {
  render ({issueKey}) {
    return (
      <div className='issue'>
        <span className='key' onClick={() => pluginCall('viewIssue', issueKey)} title='View issue'>
          {issueKey}
        </span>
        <span className='export' onClick={() => pluginCall('exportAssets', issueKey)}>
          <img src='export.png' title='Attach assets' />          
        </span>
      </div>
    )
  }
}

class Issues extends Component {
  constructor (props) {
    super(props)    
    this.state = {
      issues: (window.issues || []),
      ready: window.ready
    }
    if (!window.ready) {
      const interval = setInterval(() => {
        if (window.ready) {
          this.setState({
            issues: (window.issues || []),
            ready: window.ready            
          })
          clearInterval(interval)
        }
      }, 100)
    }
  }

  render (props, {ready, issues}) {    
    return (
      <div>        
        {!ready && 'loading...'}
        {(issues || []).map((issueKey) =>
          <Issue key={issueKey} 
            issueKey={issueKey} />
        )}
      </div>
    )
  }
}

render(<Issues />, document.getElementById('container'))

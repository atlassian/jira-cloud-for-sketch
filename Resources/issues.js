import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import pluginCall from 'sketch-module-web-view/client'


class Issue extends Component {
  render () {
    return (
      <div className='issue'>
        <span className='key' onClick={() => pluginCall('viewIssue', this.props.issueKey)} title='View issue'>
          {this.props.issueKey}
        </span>
        <span className='export' onClick={() => pluginCall('exportAssets', this.props.issueKey)}>
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

  render (props) {    
    return (
      <div>        
        {!this.state.ready && 'loading...'}
        {(this.state.issues || []).map((issueKey) =>
          <Issue key={issueKey} 
            issueKey={issueKey} />
        )}
      </div>
    )
  }
}

ReactDOM.render(<Issues />, document.getElementById('container'))

import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'
import '@atlaskit/css-reset'
import IssueList from './components/IssueList'

class ViewIssuesPanel extends Component {
  constructor (props) {
    super(props)
    this.state = {
      issues: window.issues || [],
      ready: window.ready
    }
    if (!window.ready) {
      const interval = setInterval(() => {
        if (window.ready) {
          this.setState({
            issues: window.issues || [],
            ready: window.ready
          })
          clearInterval(interval)
        }
      }, 100)
    }
  }

  render () {
    return (
      <PanelWrapper>
        <IssueList ready={this.state.ready} issues={this.state.issues} />
      </PanelWrapper>
    )
  }
}

const PanelWrapper = styled.div`
  min-width: 410px;
  padding: 15px 5px 20px 20px;
`

ReactDOM.render(<ViewIssuesPanel />, document.getElementById('container'))

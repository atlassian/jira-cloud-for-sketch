import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'
import '@atlaskit/css-reset'
import IssueList from './components/IssueList'
import IssueView from './components/IssueView'

class ViewIssuesPanel extends Component {
  constructor (props) {
    super(props)
    this.handleSelectIssue = this.handleSelectIssue.bind(this)
    this.handleCloseIssue = this.handleCloseIssue.bind(this)
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
        <IssueList
          ready={this.state.ready}
          issues={this.state.issues}
          onSelectIssue={this.handleSelectIssue}
        />
        {this.state.currentIssue && (
          <ModalPanel>
            <IssueView
              issue={this.state.currentIssue}
              onClose={this.handleCloseIssue}
            />
          </ModalPanel>
        )}
      </PanelWrapper>
    )
  }
  handleSelectIssue (issue) {
    this.setState({
      currentIssue: issue
    })
  }
  handleCloseIssue () {
    this.setState({
      currentIssue: null
    })
  }
}

const PanelWrapper = styled.div`
  min-width: 410px;
  padding: 15px 5px 20px 20px;
`

const ModalPanel = styled.div`
  position: absolute;
  top: 15px;
  left: 20px;
  width: 415px;
  height: 254px;
  background: #e7e7e7;
`

ReactDOM.render(<ViewIssuesPanel />, document.getElementById('container'))

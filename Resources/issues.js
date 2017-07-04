import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'
import pluginCall from 'sketch-module-web-view/client'
import IssueFilter from './components/IssueFilter'
import IssueList from './components/IssueList'
import IssueView from './components/IssueView'
import '@atlaskit/css-reset'

class ViewIssuesPanel extends Component {
  constructor (props) {
    super(props)
    this.handleSelectIssue = this.handleSelectIssue.bind(this)
    this.handleCloseIssue = this.handleCloseIssue.bind(this)
    this.handleFilterSelected = this.handleFilterSelected.bind(this)
    this.state = {
      loading: true,
      issues: []
    }
  }
  render () {
    return (
      <PanelWrapper>
        <HeaderDiv>
          <h3>JIRA Issues</h3>
          {this.state.filters &&
            <IssueFilter
              filters={this.state.filters}
              defaultSelected={this.state.defaultFilter}
              onFilterSelected={this.handleFilterSelected}
            />
          }
        </HeaderDiv>
        <IssueList
          loading={this.state.loading}
          issues={this.state.issues}
          onSelectIssue={this.handleSelectIssue}
        />
        {this.state.currentIssue &&
          <ModalPanel>
            <IssueView
              issue={this.state.currentIssue}
              onClose={this.handleCloseIssue}
            />
          </ModalPanel>}
      </PanelWrapper>
    )
  }
  componentDidMount () {
    window.addEventListener('jira.filters.updated', event => {
      this.setState({
        filters: event.detail.filters,
        defaultFilter: event.detail.filterSelected
      })
    })
    window.addEventListener('jira.issues.loading', event => {
      this.setState({
        loading: true,
        issues: []
      })
    })
    window.addEventListener('jira.issues.loaded', event => {
      this.setState({
        loading: false,
        issues: event.detail.issues
      })
    })
    pluginCall('onReady')
  }
  handleFilterSelected (filterKey) {
    pluginCall('filterSelected', filterKey)
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

const HeaderDiv = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 10px;
`

const ModalPanel = styled.div`
  position: absolute;
  top: 15px;
  left: 20px;
  width: 415px;
  height: 265px;
  background: #e7e7e7;
`

ReactDOM.render(<ViewIssuesPanel />, document.getElementById('container'))

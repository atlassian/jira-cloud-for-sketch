import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'
import pluginCall from 'sketch-module-web-view/client'
import Spinner from '@atlaskit/spinner'
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
      issuesLoading: true,
      profileLoading: true,
      spinnerCompleting: false,
      issues: []
    }
  }
  render () {
    var loading =
      this.state.issuesLoading ||
      this.state.profileLoading ||
      this.state.spinnerCompleting
    return (
      <PanelWrapper>
        <HeaderDiv>
          <h4>JIRA issues</h4>
          {this.state.filters &&
            <IssueFilter
              filters={this.state.filters}
              defaultSelected={this.state.defaultFilter}
              onFilterSelected={this.handleFilterSelected}
            />
          }
        </HeaderDiv>
        {loading ? (
          <SpinnerWrapper>
            <Spinner
              size='large'
              isCompleting={this.state.spinnerCompleting}
              onComplete={() => this.setState({spinnerCompleting: false})}
            />
          </SpinnerWrapper>
        ) : (
          <IssueList
            issues={this.state.issues}
            onSelectIssue={this.handleSelectIssue}
          />
        )}
        {this.state.currentIssue &&
          <ModalPanel>
            <IssueView
              issue={this.state.currentIssue}
              profile={this.state.profile}
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
        issuesLoading: true,
        spinnerCompleting: false,
        issues: []
      })
    })
    window.addEventListener('jira.issues.loaded', event => {
      this.setState(function (prevState) {
        return {
          issuesLoading: false,
          spinnerCompleting: !prevState.profileLoading,
          issues: event.detail.issues
        }
      })
    })
    window.addEventListener('jira.profile.loaded', event => {
      this.setState(function (prevState) {
        return {
          profileLoading: false,
          spinnerCompleting: !prevState.issuesLoading,
          profile: event.detail.profile
        }
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
    pluginCall('analytics', 'viewIssue')
  }
  handleCloseIssue () {
    this.setState({
      currentIssue: null
    })
    pluginCall('analytics', 'backToViewIssueList')
  }
}

const PanelWrapper = styled.div`
  padding: 10px 12px 20px 20px;
`

const HeaderDiv = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 10px;
`

const SpinnerWrapper = styled.div`
  height: 283px;
  display: flex;
  justify-content: space-around;
  align-items: center;
`

const ModalPanel = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 470px;
  height: 320px;
  padding: 10px 20px 20px 20px;
  background-color: white;
`

ReactDOM.render(<ViewIssuesPanel />, document.getElementById('container'))

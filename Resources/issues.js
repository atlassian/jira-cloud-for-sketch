import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import pluginCall from 'sketch-module-web-view/client'
import Avatar from '@atlaskit/avatar'
import styled from 'styled-components'
import '@atlaskit/css-reset'
import { akColorB50 } from '@atlaskit/util-shared-styles'

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
    var ready = this.state.ready
    return (
      <PanelWrapper>
        <h3>JIRA Issues</h3>
        <ScrollDiv>
          {ready
            ? <IssueList issues={this.state.issues} />
            : <span>Loading...</span>}
        </ScrollDiv>
      </PanelWrapper>
    )
  }
}

const PanelWrapper = styled.div`
  min-width: 410px;
  padding: 15px 5px 20px 20px;
`

const ScrollDiv = styled.div`
  margin-top: 10px;
  padding-right: 10px;
  height: 220px;
  overflow-y: scroll;
`

class IssueList extends Component {
  render () {
    var issues = this.props.issues
    return (
      <div>
        {issues.map(issue => <Issue key={issue.key} issue={issue} />)}
      </div>
    )
  }
}

IssueList.propTypes = {
  issues: PropTypes.array.isRequired
}

class Issue extends Component {
  render () {
    var issue = this.props.issue
    return (
      <IssueDiv>
        <IssueTypeField type={issue.fields.issuetype} />
        <IssueKeyField issueKey={issue.key} />
        <IssueSummaryField summary={issue.fields.summary} />
        <IssueAssigneeField assignee={issue.fields.assignee} />
      </IssueDiv>
    )
  }
}

Issue.propTypes = {
  issue: PropTypes.object.isRequired
}

const IssueDiv = styled.div`
  display: flex;
  align-items: center;
  border-radius: 3px;
  margin: 2px;
  height: 40px;
  background: white;
  &:hover {
    background: #DEEBFF;
  }
  cursor: pointer;
`

class IssueTypeField extends Component {
  render () {
    var type = this.props.type
    return (
      <TypeDiv>
        <img src={type.iconUrl} title={type.name} />
      </TypeDiv>
    )
  }
}

IssueTypeField.propTypes = {
  /*
  {
    "self": "https://jira.atlassian.com/rest/api/2/issuetype/5",
    "id": "5",
    "description": "Issue that is likely specific to the installation",
    "iconUrl": "https://jira.atlassian.com/images/icons/status_generic.gif",
    "name": "Support Request",
    "subtask": false
  }
  */
  type: PropTypes.object.isRequired
}

const TypeDiv = styled.div`
  width: 22px;
  height: 16px;
  margin-left: 5px;
`

class IssueKeyField extends Component {
  render () {
    var issueKey = this.props.issueKey
    return (
      <KeyDiv>
        {issueKey}
      </KeyDiv>
    )
  }
}

IssueKeyField.propTypes = {
  issueKey: PropTypes.string.isRequired
}

const KeyDiv = styled.div`
  width: 70px;
`

class IssueSummaryField extends Component {
  render () {
    var summary = this.props.summary
    return (
      <SummaryDiv title={summary}>
        {summary}
      </SummaryDiv>
    )
  }
}

IssueSummaryField.propTypes = {
  summary: PropTypes.string.isRequired
}

const SummaryDiv = styled.div`
  height: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 280px;
`

class IssueAssigneeField extends Component {
  render () {
    var assignee = this.props.assignee
    var avatarUrl, title
    if (assignee) {
      avatarUrl = assignee.avatarUrls['24x24']
      title = `Assigned to ${assignee.displayName || assignee.name}`
    } else {
      title = 'Unassigned'
    }
    return (
      <AvatarDiv>
        <AvatarWrapper title={title}>
          <Avatar src={avatarUrl} size='small' label={title} />
        </AvatarWrapper>
      </AvatarDiv>
    )
  }
}

IssueAssigneeField.propTypes = {
  /*
  {
    "self": "https://jira.example.com/rest/api/2/user?username=admin",
    "name": "admin",
    "key": "admin",
    "accountId": "xxxxxxxx",
    "emailAddress": "example@example.com",
    "avatarUrls": {
      "48x48": "https://...",
      "24x24": "https://...",
      "16x16": "https://...",
      "32x32": "https://..."
    },
    "displayName": "Tim Pettersen",
    "active": true,
    "timeZone": "Australia/Sydney"
  }
  */
  assignee: PropTypes.object
}

const AvatarDiv = styled.div`
  width: 30px;
`

const AvatarWrapper = styled.div`
  margin-top: 5px;
  margin-right: 5px;
`

ReactDOM.render(<ViewIssuesPanel />, document.getElementById('container'))

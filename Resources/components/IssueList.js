import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Avatar from '@atlaskit/avatar'
import styled from 'styled-components'
import '@atlaskit/css-reset'

export default class IssueList extends Component {
  render () {
    var list
    if (!this.props.ready) {
      list = <span>Loading...</span>
    } else if (this.props.issues.length === 0) {
      list = <span>No issues found.</span>
    } else {
      list = (
        <div>
          {this.props.issues.map(issue => (
            <Issue key={issue.key} issue={issue} onSelectIssue={this.props.onSelectIssue} />
          ))}
        </div>
      )
    }
    return (
      <div>
        <h3>JIRA Issues</h3>
        <ScrollDiv>
          {list}
        </ScrollDiv>
      </div>
    )
  }
}

IssueList.propTypes = {
  ready: PropTypes.bool,
  issues: PropTypes.array.isRequired,
  onSelectIssue: PropTypes.func.isRequired
}

const ScrollDiv = styled.div`
  margin-top: 10px;
  padding-right: 10px;
  height: 220px;
  overflow-y: scroll;
`

class Issue extends Component {
  render () {
    var issue = this.props.issue
    return (
      <IssueDiv onClick={() => { this.props.onSelectIssue(issue) }}>
        <IssueTypeField type={issue.fields.issuetype} />
        <IssueKeyField issueKey={issue.key} />
        <IssueSummaryField summary={issue.fields.summary} />
        <IssueAssigneeField assignee={issue.fields.assignee} />
      </IssueDiv>
    )
  }
}

Issue.propTypes = {
  issue: PropTypes.object.isRequired,
  onSelectIssue: PropTypes.func.isRequired
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

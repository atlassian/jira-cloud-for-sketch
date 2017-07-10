import React, { Component } from 'react'
import PropTypes from 'prop-types'
import AssigneeAvatar from './AssigneeAvatar'
import styled from 'styled-components'
import '@atlaskit/css-reset'

export default class IssueList extends Component {
  render () {
    var list
    if (this.props.loading) {
      list = <span>Loading...</span>
    } else if (this.props.issues.length === 0) {
      list = <span>No issues found.</span>
    } else {
      list = (
        <div>
          {this.props.issues.map(issue => (
            <Issue
              key={issue.key}
              issue={issue}
              onSelectIssue={this.props.onSelectIssue}
            />
          ))}
        </div>
      )
    }
    return (
      <div>
        <ScrollDiv>
          {list}
        </ScrollDiv>
      </div>
    )
  }
}

IssueList.propTypes = {
  loading: PropTypes.bool,
  issues: PropTypes.array.isRequired,
  onSelectIssue: PropTypes.func.isRequired
}

const ScrollDiv = styled.div`
  margin-top: 10px;
  padding-right: 10px;
  height: 230px;
  overflow-y: scroll;
`

class Issue extends Component {
  render () {
    var issue = this.props.issue
    return (
      <IssueDiv
        onClick={() => {
          this.props.onSelectIssue(issue)
        }}
      >
        <IssueTypeField type={issue.fields.issuetype} />
        <IssueKeyField issueKey={issue.key} />
        <IssueSummaryField summary={issue.fields.summary} />
        <AssigneeAvatar assignee={issue.fields.assignee} />
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
  width: 60px;
  font-size: 12px;
  color: #7a869a;
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
  width: 285px;
  margin-right: 5px;
`

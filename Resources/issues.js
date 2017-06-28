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
            ? <IssueTable issues={this.state.issues} />
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

class IssueTable extends Component {
  render () {
    var issues = this.props.issues
    return (
      <StyledTable>
        <TableBody>
          {issues.map(issue => <IssueRow key={issue.key} issue={issue} />)}
        </TableBody>
      </StyledTable>
    )
  }
}

IssueTable.propTypes = {
  issues: PropTypes.array.isRequired
}

const StyledTable = styled.table`
  border-spacing: 0 3px;
`

const TableBody = styled.tbody`
  border: none;
`

class IssueRow extends Component {
  render () {
    var issue = this.props.issue
    return (
      <TableRow>
        <IssueTypeField type={issue.fields.issuetype} />
        <IssueKeyField issueKey={issue.key} />
        <IssueSummaryField summary={issue.fields.summary} />
        <IssueAssigneeField assignee={issue.fields.assignee} />
      </TableRow>
    )
  }
}

IssueRow.propTypes = {
  issue: PropTypes.object.isRequired
}

const TableRow = styled.tr`
  cursor: pointer;
  background: white;
  &:hover {
    background: #DEEBFF;
  }
`

class IssueTypeField extends Component {
  render () {
    var type = this.props.type
    return (
      <TypeCell>
        <TypeImg src={type.iconUrl} title={type.name} />
      </TypeCell>
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

const TypeCell = styled.td`
  &:first-child {
    border-radius: 3px 0 0 3px;
  }
  &:last-child {
    border-radius: 0 3px 3px 0;
  }
`

const TypeImg = styled.img`
  margin-top: 5px;
  margin-left: 5px;
`

class IssueKeyField extends Component {
  render () {
    var issueKey = this.props.issueKey
    return (
      <td>
        {issueKey}
      </td>
    )
  }
}

IssueKeyField.propTypes = {
  issueKey: PropTypes.string.isRequired
}

class IssueSummaryField extends Component {
  render () {
    var summary = this.props.summary
    return (
      <td>
        <div title={summary}>
          {summary}
        </div>
      </td>
    )
  }
}

IssueSummaryField.propTypes = {
  summary: PropTypes.string.isRequired
}

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
      <td>
        <AvatarWrapper title={title}>
          <Avatar src={avatarUrl} size='small' label={title} />
        </AvatarWrapper>
      </td>
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

const AvatarWrapper = styled.div`
  margin-top: 5px;
  margin-right: 5px;
`

ReactDOM.render(<ViewIssuesPanel />, document.getElementById('container'))

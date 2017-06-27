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
      <div>
        <h3>JIRA Issues</h3>
        {ready
          ? <IssueTable issues={this.state.issues} />
          : <span>Loading...</span>}
      </div>
    )
  }
}

class IssueTable extends Component {
  render () {
    var issues = this.props.issues
    return (
      <table>
        <tbody>
          {issues.map(issue => <IssueRow key={issue.key} issue={issue} />)}
        </tbody>
      </table>
    )
  }
}

IssueTable.propTypes = {
  issues: PropTypes.array.isRequired
}

class IssueRow extends Component {
  render () {
    var issue = this.props.issue
    return (
      <tr>
        <IssueTypeField type={issue.fields.issuetype} />
        <IssueKeyField issueKey={issue.key} />
        <IssueSummaryField summary={issue.fields.summary} />
        <IssueAssigneeField assignee={issue.fields.assignee} />
      </tr>
    )
  }
}

IssueRow.propTypes = {
  issue: PropTypes.object.isRequired
}

class IssueTypeField extends Component {
  render () {
    var type = this.props.type
    return (
      <td>
        <img src={type.iconUrl} title={type.name} />
      </td>
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
        {summary}
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
    var avatarUrl = assignee ? assignee.avatarUrls['24x24'] : null
    return (
      <td>
        <Avatar src={avatarUrl} size='small' />
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

ReactDOM.render(<ViewIssuesPanel />, document.getElementById('container'))

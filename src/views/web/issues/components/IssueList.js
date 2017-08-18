import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import AssigneeAvatar from './AssigneeAvatar'
import { akGridSizeUnitless } from '@atlaskit/util-shared-styles'
import '@atlaskit/css-reset'

@observer
export default class IssueList extends Component {
  constructor (props) {
    super(props)
    this.calculateMaxKeyLength = this.calculateMaxKeyLength.bind(this)
  }
  render () {
    var list
    if (this.props.issues.length === 0) {
      list = <span>No issues found.</span>
    } else {
      const maxKeyLength = this.calculateMaxKeyLength()
      list = (
        <div>
          {this.props.issues.map(issue => (
            <Issue
              key={issue.key}
              maxKeyLength={maxKeyLength}
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
  calculateMaxKeyLength () {
    let maxLength = 0
    this.props.issues.forEach(issue => {
      if (issue.key.length > maxLength) {
        maxLength = issue.key.length
      }
    })
    return maxLength
  }
}

IssueList.propTypes = {
  issues: PropTypes.object.isRequired, // array-ish
  onSelectIssue: PropTypes.func.isRequired
}

const ScrollDiv = styled.div`
  margin-top: 10px;
  padding-right: 10px;
  height: 283px;
  overflow-y: auto;
`

@observer
class Issue extends Component {
  render () {
    const { issue, maxKeyLength } = this.props
    const keyWidthPx = 3 + maxKeyLength * 8
    const summaryWidthPx = 386 - keyWidthPx
    return (
      <IssueDiv
        onClick={() => {
          this.props.onSelectIssue(issue)
        }}
      >
        <IssueTypeField type={issue.type} />
        <IssueKeyField issueKey={issue.key} widthPx={keyWidthPx} />
        <IssueSummaryField summary={issue.summary} widthPx={summaryWidthPx} />
        <IssueAssigneeField>
          <AssigneeAvatar assignee={issue.assignee} />
        </IssueAssigneeField>
      </IssueDiv>
    )
  }
}

Issue.propTypes = {
  maxKeyLength: PropTypes.number.isRequired,
  issue: PropTypes.object.isRequired,
  onSelectIssue: PropTypes.func.isRequired
}

const IssueDiv = styled.div`
  display: flex;
  align-items: center;
  border: 1px #F4F5F7 solid;
  border-bottom: none;
  height: 46px;
  background-color: white;
  cursor: pointer;
  &:hover {
    background-color: #EBECF0;
  }
  &:first-of-type {
    border-radius: 3px 3px 0 0;
  }
  &:last-of-type {
    border-radius: 0 0 3px 3px;
    border-bottom: 1px #F4F5F7 solid;
  }
`

@observer
class IssueTypeField extends Component {
  render () {
    const type = this.props.type
    return (
      <TypeDiv>
        <TypeImage src={type.iconUrl} title={type.name} />
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
  width: 20px;
  height: 16px;
  margin-left: 14px;
`

const TypeImage = styled.img`
  width: 16px;
  height: 16px;
`

@observer
class IssueKeyField extends Component {
  render () {
    const { issueKey, widthPx } = this.props
    return (
      <KeyDiv style={{width: `${widthPx}px`}}>
        {issueKey}
      </KeyDiv>
    )
  }
}

IssueKeyField.propTypes = {
  issueKey: PropTypes.string.isRequired,
  widthPx: PropTypes.number.isRequired
}

const KeyDiv = styled.div`
  font-size: 12px;
  color: #7a869a;
`

@observer
class IssueSummaryField extends Component {
  render () {
    const {summary, widthPx} = this.props
    return (
      <SummaryDiv title={summary} style={{width: `${widthPx}px`}}>
        {summary}
      </SummaryDiv>
    )
  }
}

IssueSummaryField.propTypes = {
  summary: PropTypes.string.isRequired,
  widthPx: PropTypes.number.isRequired
}

const SummaryDiv = styled.div`
  height: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 5px;
  font-family: -apple-system;
`

const IssueAssigneeField = styled.div`
  margin-right: ${akGridSizeUnitless * 2}px;
`

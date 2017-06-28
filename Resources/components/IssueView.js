import React, { Component } from 'react'
import PropTypes from 'prop-types'
import pluginCall from 'sketch-module-web-view/client'
import AssigneeAvatar from './AssigneeAvatar'
import styled from 'styled-components'
import '@atlaskit/css-reset'

export default class IssueView extends Component {
  render () {
    return (
      <div>
        <BackButton onClose={this.props.onClose} />
        <IssueSummary issue={this.props.issue} />
        <DropZone />
      </div>
    )
  }
}

IssueView.propTypes = {
  issue: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
}

class BackButton extends Component {
  render () {
    return (
      <ClickableH3 onClick={this.props.onClose}>&lt; Back</ClickableH3>
    )
  }
}

BackButton.propTypes = {
  onClose: PropTypes.func.isRequired
}

const ClickableH3 = styled.h3`
  cursor: pointer;
`

class IssueSummary extends Component {
  render () {
    var issue = this.props.issue
    return (
      <SummaryDiv>
        <SummaryText>{issue.fields.summary}</SummaryText>
        <SummaryInfoBar issue={issue} />
      </SummaryDiv>
    )
  }
}

IssueSummary.propTypes = {
  issue: PropTypes.object.isRequired
}

const SummaryDiv = styled.div`
  margin-top: 10px;
  padding: 12px 12px 3px 12px;
  border-radius: 3px;
  background: white;
`

const SummaryText = styled.div`
  max-height: 70px;
`

class SummaryInfoBar extends Component {
  render () {
    var issue = this.props.issue
    return (
      <InfoBarDiv>
        <IssueType type={issue.fields.issuetype} />
        <KeyAndAvatarWrapper>
          <IssueKey issue={issue} />
          <AssigneeAvatar assignee={issue.fields.assignee} />
        </KeyAndAvatarWrapper>
      </InfoBarDiv>
    )
  }
}

SummaryInfoBar.propTypes = {
  issue: PropTypes.object.isRequired
}

const InfoBarDiv = styled.div`
  margin-top: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const KeyAndAvatarWrapper = styled.div`
  display: flex;
  align-items: center;
`

class IssueType extends Component {
  render () {
    var type = this.props.type
    return (
      <img src={type.iconUrl} title={type.name} />
    )
  }
}

IssueType.propTypes = {
  type: PropTypes.object.isRequired
}

class IssueKey extends Component {
  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }
  render () {
    return (
      <IssueKeyLink onClick={this.handleClick}>{this.props.issue.key}</IssueKeyLink>
    )
  }
  handleClick () {
    pluginCall('openInBrowser', this.browseUrl())
  }
  browseUrl () {
    var issue = this.props.issue
    var baseUrl = issue.self.substring(0, issue.self.indexOf('/rest/'))
    return `${baseUrl}/browse/${issue.key}`
  }
}

IssueKey.propTypes = {
  issue: PropTypes.object.isRequired
}

const IssueKeyLink = styled.a`
  margin-right: 10px;
`

class DropZone extends Component {
  render () {
    return (
      <DropZoneDiv>DropZone</DropZoneDiv>
    )
  }
}

const DropZoneDiv = styled.div`
  margin-top: 10px;
  padding: 4px;
  height: 40px;
  border-radius: 3px;
  border: dashed 1px gray;
`

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import pluginCall from 'sketch-module-web-view/client'
import { akColorN100, akGridSizeUnitless } from '@atlaskit/util-shared-styles'
import Attachments from './Attachments'
import Comments from './Comments'
import styled from 'styled-components'
import '@atlaskit/css-reset'

export default class IssueView extends Component {
  render () {
    return (
      <div>
        <Breadcrumbs issue={this.props.issue} onClose={this.props.onClose} />
        <IssueSummary issue={this.props.issue} />
        <Attachments issueKey={this.props.issue.key} />
        <Comments
          issueKey={this.props.issue.key}
          profile={this.props.profile}
        />
      </div>
    )
  }
}

IssueView.propTypes = {
  issue: PropTypes.object.isRequired,
  profile: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
}

class Breadcrumbs extends Component {
  render () {
    return (
      <BreadcrumbsWrapper>
        <BackLink onClose={this.props.onClose} />
        <Separator>/</Separator>
        <IssueKey issue={this.props.issue} />
      </BreadcrumbsWrapper>
    )
  }
}

Breadcrumbs.propTypes = {
  issue: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
}

const BreadcrumbsWrapper = styled.div`
  display: flex;
  align-items: center;
`

class BackLink extends Component {
  render () {
    return <ClickableSpan onClick={this.props.onClose}>
      &lt; Sketch JIRA plugin
    </ClickableSpan>
  }
}

BackLink.propTypes = {
  onClose: PropTypes.func.isRequired
}

const ClickableSpan = styled.span`
  cursor: pointer;
`

const Separator = styled.div`
  color: ${akColorN100};
  padding-left: ${akGridSizeUnitless}px;
  text-align: center;
  width: ${akGridSizeUnitless}px;
  font-size: 16px;
  height: 24px;
`

class IssueKey extends Component {
  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }
  render () {
    return (
      <IssueKeyLink onClick={this.handleClick} title='Open issue in browser'>
        <IssueType type={this.props.issue.fields.issuetype} />
        {this.props.issue.key}
      </IssueKeyLink>
    )
  }
  handleClick () {
    pluginCall('openInBrowser', this.browseUrl())
    pluginCall('analytics', 'viewIssueOpenInBrowser')
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

const IssueKeyLink = styled.div`
  cursor: pointer;
  margin-left: ${akGridSizeUnitless}px;
  color: #7a869a;
  font-size: 12px;
  display: flex;
  align-items: center;
`

class IssueType extends Component {
  render () {
    var type = this.props.type
    return (
      <TypeIcon src={type.iconUrl} title={type.name} />
    )
  }
}

IssueType.propTypes = {
  type: PropTypes.object.isRequired
}

const TypeIcon = styled.img`
  margin-right: 4px;
`

class IssueSummary extends Component {
  render () {
    var issue = this.props.issue
    return (
      <SummaryDiv>
        <h5>{issue.fields.summary}</h5>
      </SummaryDiv>
    )
  }
}

IssueSummary.propTypes = {
  issue: PropTypes.object.isRequired
}

const SummaryDiv = styled.div`
  margin-top: 10px;
`

import React, { Component } from 'react'
import PropTypes from 'prop-types'
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
    return (
      <SummaryDiv>
        <div>{this.props.issue.fields.summary}</div>
      </SummaryDiv>
    )
  }
}

IssueSummary.propTypes = {
  issue: PropTypes.object.isRequired
}

const SummaryDiv = styled.div`
  margin-top: 10px;
  padding: 10px;
  height: 100px;
  border-radius: 3px;
  background: white;
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

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import Attachments from './Attachments'
import Comments from './Comments'
import styled from 'styled-components'
import '@atlaskit/css-reset'

@observer
export default class IssueView extends Component {
  render () {
    const { issue, profile } = this.props
    return (
      <div>
        <IssueSummary issue={issue} />
        <Attachments issue={issue} />
        <Comments
          issue={issue}
          profile={profile}
        />
      </div>
    )
  }
}

IssueView.propTypes = {
  issue: PropTypes.object.isRequired,
  profile: PropTypes.object
}

class IssueSummary extends Component {
  render () {
    var issue = this.props.issue
    return (
      <SummaryDiv>
        <h5>{issue.summary}</h5>
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

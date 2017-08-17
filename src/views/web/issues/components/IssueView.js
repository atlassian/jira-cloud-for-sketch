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
        <MinHeight>
          <IssueSummary issue={issue} />
          <Attachments issue={issue} />
        </MinHeight>
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

/** ensures the comment input box is at the bottom of the frame */
const MinHeight = styled.div`
  min-height: 272px;
`

@observer
class IssueSummary extends Component {
  render () {
    var issue = this.props.issue
    return (
      <SummaryDiv>
        <SummaryH5>{issue.summary}</SummaryH5>
      </SummaryDiv>
    )
  }
}

IssueSummary.propTypes = {
  issue: PropTypes.object.isRequired
}

const SummaryDiv = styled.div`
  margin-top: 7px;
  margin-bottom: 5px;
`
const SummaryH5 = styled.h5`
  line-height: 1.4;
  letter-spacing: -.008em;
  font-size: 14px;
  font-weight: 400;
  color: #253858;
`

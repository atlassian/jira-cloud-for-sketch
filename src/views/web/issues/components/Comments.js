import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import Spinner from '@atlaskit/spinner'
import Avatar from '@atlaskit/avatar'
import CheckIcon from '@atlaskit/icon/glyph/check'
import CommentEditor from './CommentEditor'

@observer
export default class Comments extends Component {
  render () {
    var avatar
    if (this.props.profile) {
      avatar = <Avatar
        size='medium'
        src={this.props.profile.avatarUrls['32x32']}
        label={this.props.profile.displayName}
      />
    } else {
      avatar = <Avatar size='medium' />
    }
    return (
      <CommentsArea>
        <CommentInput>
          <AvatarWrapper>
            {avatar}
          </AvatarWrapper>
          <CommentEditor issue={this.props.issue} />
        </CommentInput>
        <CommentStatus issue={this.props.issue} />
      </CommentsArea>
    )
  }
}

Comments.propTypes = {
  issue: PropTypes.object.isRequired,
  profile: PropTypes.object
}

const CommentsArea = styled.div`
  padding-bottom: 24px;
`

const CommentInput = styled.div`
  display: flex;
`

const AvatarWrapper = styled.div`
  margin-right: 8px;
`

@observer
class CommentStatus extends Component {
  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }
  render () {
    const issue = this.props.issue
    let status = null
    if (issue.postingComment) {
      status = (
        <SpinnerWrapper>
          <Spinner size='small' />
        </SpinnerWrapper>
      )
    } else if (issue.postedCommentHref) {
      status = (
        <SuccessWrapper>
          <CheckIcon
            size='small'
            label='Success'
            primaryColor='#36B37E'
          />
          <CommentLinkWrapper>
            Comment posted (<a href={issue.postedCommentHref} onClick={this.handleClick}>
              View in JIRA
            </a>)
          </CommentLinkWrapper>
        </SuccessWrapper>
      )
    }
    return (
      <StatusWrapper>{status}</StatusWrapper>
    )
  }
  handleClick (event) {
    event.preventDefault()
    this.props.issue.openPostedCommentInBrowser()
  }
}

CommentStatus.propTypes = {
  issue: PropTypes.object.isRequired
}

const StatusWrapper = styled.div`
  margin-left: 40px;
  display: flex;
  align-items: center;
`

const SpinnerWrapper = styled.div`
  margin-top: 4px;
`

const SuccessWrapper = styled.div`
  display: flex;
  align-items: center;
`

const CommentLinkWrapper = styled.span`
  margin-left: 4px;
  font-size: 12px;
  color: #5E6C84;
`

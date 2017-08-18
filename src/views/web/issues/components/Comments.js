import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import Avatar from '@atlaskit/avatar'
import CheckIcon from '@atlaskit/icon/glyph/check'
import CommentEditor from './CommentEditor'

@observer
export default class Comments extends Component {
  render () {
    const { profile, issue } = this.props
    let avatar
    if (profile) {
      avatar = <Avatar
        size='medium'
        src={profile.avatarUrls['32x32']}
        label={profile.displayName}
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
          <CommentEditor commentEditor={issue.commentEditor} />
        </CommentInput>
        <CommentStatus commentEditor={issue.commentEditor} />
      </CommentsArea>
    )
  }
}

Comments.propTypes = {
  issue: PropTypes.object.isRequired,
  profile: PropTypes.object
}

const CommentsArea = styled.div`
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
    this.model = props.commentEditor
    this.handleLinkClick = this.handleLinkClick.bind(this)
  }
  render () {
    const { isFocused, href } = this.model
    let status = ' '
    if (href) {
      status = (
        <StatusTextWrapper>
          <CheckIcon
            size='small'
            label='Success'
            primaryColor='#36B37E'
          />
          <CommentLinkWrapper>
            Comment posted (<a href={href} onClick={this.handleLinkClick}>
              View in JIRA
            </a>)
          </CommentLinkWrapper>
        </StatusTextWrapper>
      )
    } else if (isFocused) {
      status = (
        <HelpTextWrapper>
          Enter to submit,
          Shift-Enter for new line,
          @mention a user
        </HelpTextWrapper>
      )
    }
    return (
      <StatusWrapper>{status}</StatusWrapper>
    )
  }
  handleLinkClick (event) {
    event.preventDefault()
    this.model.openPostedCommentInBrowser()
  }
}

CommentStatus.propTypes = {
  commentEditor: PropTypes.object.isRequired
}

const StatusWrapper = styled.div`
  margin-left: 47px;
  display: flex;
  align-items: center;
  height: 24px;
`
const StatusTextWrapper = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 12px;
`
const HelpTextWrapper = styled.div`
  font-size: 10px;
  padding-bottom: 12px;
  color: #7a869a;
`
const CommentLinkWrapper = styled.span`
  margin-left: 4px;
  font-size: 10px;
  color: #5E6C84;
`

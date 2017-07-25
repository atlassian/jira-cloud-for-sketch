import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import pluginCall from 'sketch-module-web-view/client'
import Spinner from '@atlaskit/spinner'
import Avatar from '@atlaskit/avatar'
import CheckIcon from '@atlaskit/icon/glyph/check'
import CommentEditor from './CommentEditor'

export default class Comments extends Component {
  constructor (props) {
    super(props)
    this.state = {
      posting: false
    }
  }
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
          <CommentEditor
            issueKey={this.props.issueKey}
            onSubmitStart={() => { this.setState({posting: true}) }}
            onSubmitDone={(commentHref) => {
              this.setState({
                posting: false,
                commentHref
              })
            }}
          />
        </CommentInput>
        <CommentStatus
          posting={this.state.posting}
          commentHref={this.state.commentHref}
        />
      </CommentsArea>
    )
  }
}

Comments.propTypes = {
  issueKey: PropTypes.string.isRequired,
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

class CommentStatus extends Component {
  render () {
    var status = null
    if (this.props.posting) {
      status = (
        <SpinnerWrapper>
          <Spinner size='small' />
        </SpinnerWrapper>
      )
    } else if (this.props.commentHref) {
      status = (
        <SuccessWrapper>
          <CheckIcon
            size='small'
            label='Success'
            primaryColor='#36B37E'
          />
          <CommentLinkWrapper>
            Comment posted (<a
              href={this.props.commentHref}
              onClick={(event) => {
                pluginCall('openInBrowser', this.props.commentHref)
                event.preventDefault()
              }}
            >View in JIRA</a>)
          </CommentLinkWrapper>
        </SuccessWrapper>
      )
    }
    return (
      <StatusWrapper>{status}</StatusWrapper>
    )
  }
}

CommentStatus.propTypes = {
  posting: PropTypes.bool.isRequired,
  commentHref: PropTypes.string
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

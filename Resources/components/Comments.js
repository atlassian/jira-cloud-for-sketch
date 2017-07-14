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
    var avatarUrl = this.props.profile.avatarUrls['32x32']
    var displayName = this.props.profile.displayName
    return (
      <CommentsArea>
        <CommentInput>
          <AvatarWrapper>
            <Avatar src={avatarUrl} size='medium' label={displayName} />
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
  profile: PropTypes.object.isRequired
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
      status = <Spinner size='small' />
    } else if (this.props.commentHref) {
      status = (
        <div>
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
        </div>
      )
    }
    return (
      <StatusWrapper>{status}</StatusWrapper>
    )
  }
}

CommentStatus.propTypes = {
  posting: PropTypes.bool.isRequired,
  commentHref: PropTypes.string.isRequired
}

const StatusWrapper = styled.div`
  margin-left: 40px;
  padding-top: 4px;
  display: flex;
  align-items: center;
`

const CommentLinkWrapper = styled.span`
  margin-left: 4px;
`

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Spinner from '@atlaskit/spinner'
import Avatar from '@atlaskit/avatar'
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
        <AvatarWrapper>
          <Avatar src={avatarUrl} size='medium' label={displayName} />
        </AvatarWrapper>
        <CommentEditor
          issueKey={this.props.issueKey}
          onSubmitStart={() => { this.setState({posting: true}) }}
          onSubmitDone={() => { this.setState({posting: false}) }}
        />
      </CommentsArea>
    )
  }
}

Comments.propTypes = {
  issueKey: PropTypes.string.isRequired,
  profile: PropTypes.object.isRequired
}

const AvatarWrapper = styled.div`
  margin-right: 8px;
`

const CommentsArea = styled.div`
  display: flex;
  padding-bottom: 24px;
`

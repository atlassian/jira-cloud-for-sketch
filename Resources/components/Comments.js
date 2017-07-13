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
    return (
      <CommentsArea>
        <CommentsHeader>
          <h4>Comments</h4>
          <SpinnerWrapper>
            <Spinner size='small' isCompleting={!this.state.posting} />
          </SpinnerWrapper>
        </CommentsHeader>
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
  issueKey: PropTypes.string.isRequired
}

const CommentsArea = styled.div`
  padding-bottom: 20px;
`

const CommentsHeader = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-content: center;
`

const SpinnerWrapper = styled.div`
  margin-left: 5px;
  height: 25px;
`

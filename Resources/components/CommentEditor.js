import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import pluginCall from 'sketch-module-web-view/client'
import FieldBase from '@atlaskit/field-base'

export default class CommentEditor extends Component {
  constructor (props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.onCommentAdded = this.onCommentAdded.bind(this)
    this.state = {
      value: '',
      posting: false
    }
  }
  render () {
    return (
      <FieldBase isPaddingDisabled>
        <TextArea
          disabled={this.state.posting}
          placeholder='Add a comment...'
          value={this.state.value}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
        />
      </FieldBase>
    )
  }
  componentDidMount () {
    window.addEventListener('jira.comment.added', this.onCommentAdded)
  }
  componentWillUnmount () {
    window.removeEventListener('jira.comment.added', this.onCommentAdded)
  }
  handleChange (event) {
    this.setState({value: event.target.value})
  }
  handleKeyDown (event) {
    if (event.keyCode == 13) {
      if (!event.shiftKey) {
        event.preventDefault()
        this.handleSubmit()
      }
    }
  }
  handleSubmit () {
    if (this.state.value && this.state.value.trim().length > 0) {
      this.props.onSubmitStart()
      pluginCall('addComment', this.props.issueKey, this.state.value)
      this.setState({
        value: '',
        posting: true
      })
    }
  }
  onCommentAdded (event) {
    if (event.detail.issueKey == this.props.issueKey) {
      this.setState({
        posting: false
      })
      this.props.onSubmitDone()
    }
  }
}

CommentEditor.propTypes = {
  issueKey: PropTypes.string.isRequired,
  onSubmitStart: PropTypes.func.isRequired,
  onSubmitDone: PropTypes.func.isRequired
}

const TextArea = styled.textarea`
  border: none;
  font: inherit;
  background: inherit;
  padding: 4px 6px;
  width: 390px;
`

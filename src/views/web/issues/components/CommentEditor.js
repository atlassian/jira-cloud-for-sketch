import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import FieldBase from '@atlaskit/field-base'
import TextArea from 'react-textarea-autosize'

@observer
export default class CommentEditor extends Component {
  constructor (props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleTextAreaHeightChange = this.handleTextAreaHeightChange.bind(this)
  }
  render () {
    const issue = this.props.issue
    const style = {
      border: 'none',
      font: 'inherit',
      background: 'inherit',
      padding: '6px 6px 4px 6px',
      width: '410px',
      height: '22px'
    }
    return (
      <FieldBase isPaddingDisabled>
        <TextArea
          useCacheForDOMMeasurements
          style={style}
          disabled={issue.postingComment}
          placeholder='Add a comment...'
          value={issue.commentText}
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          onHeightChange={this.handleTextAreaHeightChange}
        />
      </FieldBase>
    )
  }
  handleChange (event) {
    this.props.issue.commentText = event.target.value
  }
  handleKeyDown (event) {
    // enter = submit, shift+enter = insert line break
    if (event.keyCode == 13) {
      if (!event.shiftKey) {
        event.preventDefault()
        this.props.issue.postComment()
      }
    }
  }
  handleTextAreaHeightChange (height, instance) {
    if (this.prevRowCount && instance.rowCount > this.prevRowCount) {
      // scroll to bottom of page
      window.scrollTo(0, document.body.scrollHeight)
    }
    this.prevRowCount = instance.rowCount
  }
}

CommentEditor.propTypes = {
  issue: PropTypes.object.isRequired
}

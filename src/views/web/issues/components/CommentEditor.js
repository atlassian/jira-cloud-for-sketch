import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import FieldBase from '@atlaskit/field-base'
import { MentionList } from '@atlaskit/mention'
import TextArea from 'react-textarea-autosize'

@observer
export default class CommentEditor extends Component {
  constructor (props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleTextAreaHeightChange = this.handleTextAreaHeightChange.bind(this)
    this.setCommentInputRef = this.setCommentInputRef.bind(this)
    this.findMentionUnderCaret = this.findMentionUnderCaret.bind(this)
    this.handleMentionListRef = this.handleMentionListRef.bind(this)
    this.handleMentionSelected = this.handleMentionSelected.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.state = {
      isFocused: false
    }
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
    const placeholder = this.state.isFocused
      ? '@ to mention users, ⬆+Enter to add new lines'
      : 'Add a comment...'
    return (
      <RelativeDiv>
        <Mentions
          issue={issue}
          isFocused={this.state.isFocused}
          onSelection={this.handleMentionSelected}
          handleMentionListRef={this.handleMentionListRef}
        />
        <FieldBase isPaddingDisabled>
          <TextArea
            inputRef={this.setCommentInputRef}
            useCacheForDOMMeasurements
            style={style}
            disabled={issue.postingComment}
            placeholder={placeholder}
            value={issue.commentText}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            onKeyDown={this.handleKeyDown}
            onHeightChange={this.handleTextAreaHeightChange}
          />
        </FieldBase>
      </RelativeDiv>
    )
  }
  handleFocus () {
    this.setState({isFocused: true})
  }
  handleBlur () {
    this.setState({isFocused: false})
  }
  handleChange (event) {
    this.props.issue.onCommentTextChanged(
      event.target.value,
      this.findMentionUnderCaret()
    )
  }
  handleKeyDown (event) {
    if (this.props.issue.mentions.length && this.state.isFocused && this.mentionListRef) {
      // mention list is open, steal enter and cursor keys
      switch (event.keyCode) {
        case 13: // enter
          event.preventDefault()
          this.mentionListRef.chooseCurrentSelection()
          break
        case 38: // up
          event.preventDefault()
          this.mentionListRef.selectPrevious()
          break
        case 40: // down
          event.preventDefault()
          this.mentionListRef.selectNext()
          break
      }
    } else if (event.keyCode === 13) {
      // enter = submit, shift+enter = insert line break
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
  setCommentInputRef (commentInputRef) {
    this.commentInputRef = commentInputRef
  }
  findMentionUnderCaret () {
    const input = this.commentInputRef
    if (input && input.selectionStart === input.selectionEnd) {
      const mention = input.value.substring(0, input.selectionStart).match(/@(\w*)$/)
      if (mention) {
        return mention[1]
      }
    }
  }
  handleMentionListRef (ref) {
    this.mentionListRef = ref
  }
  handleMentionSelected (selectedUser) {
    const input = this.commentInputRef
    if (input && input.selectionStart === input.selectionEnd) {
      let mention = input.value.substring(0, input.selectionStart).match(/@\w*$/)
      if (!mention) {
        // avoid race condition
        return
      }
      mention = mention[0]
      const precedingText = input.value.substring(0, input.selectionStart - mention.length)
      const trailingText = input.value.substring(input.selectionStart)
      const updatedComment = `${precedingText}[~${selectedUser.mentionName}]${trailingText}`
      this.props.issue.onCommentTextChanged(updatedComment)
      // move caret to end of inserted @mention
      input.selectionStart = input.selectionEnd = precedingText.length + selectedUser.mentionName.length + 3
    }
  }
}

CommentEditor.propTypes = {
  issue: PropTypes.object.isRequired
}
const RelativeDiv = styled.div`
  position: relative;
`

@observer
class Mentions extends Component {
  render () {
    const { issue, isFocused, onSelection, handleMentionListRef } = this.props
    // defensive copy to real Array so MentionList doesn't freak out
    const mentions = issue.mentions.slice()
    if (!mentions.length || !isFocused) {
      return null
    }
    const wrapperStyle = {
      top: `${mentions.length * -48 - 12}px`
    }
    return (
      <MentionListWrapper style={wrapperStyle}>
        <MentionList
          mentions={mentions}
          onSelection={onSelection}
          ref={handleMentionListRef}
        />
      </MentionListWrapper>
    )
  }
}

Mentions.propTypes = {
  issue: PropTypes.object.isRequired,
  isFocused: PropTypes.bool.isRequired,
  onSelection: PropTypes.func.isRequired,
  handleMentionListRef: PropTypes.func.isRequired
}
const MentionListWrapper = styled.div`
  position: absolute;
  z-index: 100;
`

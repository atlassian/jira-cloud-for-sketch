import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import FieldBase from '@atlaskit/field-base'
import { MentionList } from '@atlaskit/mention'
import { akColorN20, akColorN20A, akColorN60 } from '@atlaskit/util-shared-styles'
import TextArea from 'react-textarea-autosize'
import { assign } from 'lodash'

@observer
export default class CommentEditor extends Component {
  constructor (props) {
    super(props)
    this.model = props.commentEditor
    this.handleChange = this.handleChange.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleTextAreaHeightChange = this.handleTextAreaHeightChange.bind(this)
    this.handleInputRef = this.handleInputRef.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
  }
  render () {
    const { isPosting, text } = this.model
    const style = {
      border: 'none',
      font: 'inherit',
      background: 'inherit',
      padding: '6px 6px 4px 6px',
      width: '410px',
      height: '22px'
    }
    if (isPosting) {
      assign(style, {
        cursor: 'not-allowed',
        pointerEvents: 'none',
        background: akColorN20,
        border: akColorN20A,
        text: akColorN60
      })
    }
    return (
      <RelativeDiv>
        <Mentions
          commentEditor={this.props.commentEditor}
          handleMentionListRef={this.handleMentionListRef}
        />
        <FieldBase isPaddingDisabled>
          <TextArea
            className='issue-comment-input'
            inputRef={this.handleInputRef}
            useCacheForDOMMeasurements
            style={style}
            disabled={isPosting}
            placeholder='Add a comment...'
            value={text}
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
    this.model.isFocused = true
  }
  handleBlur () {
    this.model.isFocused = false
  }
  handleChange (event) {
    this.model.onTextChanged(event.target.value)
  }
  handleInputRef (inputRef) {
    this.model.inputRef = inputRef
  }
  handleKeyDown (event) {
    this.model.onKeyDown(event)
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
  commentEditor: PropTypes.object.isRequired
}
const RelativeDiv = styled.div`
  position: relative;
`

@observer
class Mentions extends Component {
  constructor (props) {
    super(props)
    this.model = props.commentEditor
    this.handleMentionListRef = this.handleMentionListRef.bind(this)
    this.handleMentionSelected = this.handleMentionSelected.bind(this)
  }
  render () {
    const { isFocused } = this.model
    // defensive copy to real Array so MentionList doesn't freak out
    const mentions = this.model.mentions.slice()
    if (!mentions.length || !isFocused) {
      return null
    }
    let wrapperStyle
    const maxDisplayedMentions = 5
    if (mentions.length > maxDisplayedMentions) {
      // will scroll
      wrapperStyle = {
        top: `${maxDisplayedMentions * -48 - 36}px`,
        maxHeight: `${maxDisplayedMentions * -48}px`
      }
    } else {
      wrapperStyle = {
        top: `${mentions.length * -48 - 12}px`
      }
    }
    return (
      <MentionListWrapper style={wrapperStyle}>
        <MentionList
          mentions={mentions}
          onSelection={this.handleMentionSelected}
          ref={this.handleMentionListRef}
        />
      </MentionListWrapper>
    )
  }
  handleMentionSelected (selection) {
    this.model.onMentionSelected(selection)
  }
  handleMentionListRef (mentionListRef) {
    this.model.mentionListRef = mentionListRef
  }
}

Mentions.propTypes = {
  commentEditor: PropTypes.object.isRequired
}
const MentionListWrapper = styled.div`
  position: absolute;
  z-index: 100;
`

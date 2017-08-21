import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import { CardView } from '@atlaskit/media-card'
import moment from 'moment'

@observer
export default class Attachment extends Component {
  constructor (props) {
    super(props)
    this.dragEnter = this.dragEnter.bind(this)
    this.dragLeave = this.dragLeave.bind(this)
    this.drop = this.drop.bind(this)
    this.state = {
      dragHover: 0
    }
  }
  render () {
    var attachment = this.props.attachment
    return (
      <AttachmentWrapper className='issue-attachment'
        onDragEnter={this.dragEnter}
        onDragLeave={this.dragLeave}
        onDragOver={(event) => { event.preventDefault() }}
        onDropCapture={this.drop}
      >
        <AttachmentCard
          attachment={attachment}
          dragHover={this.state.dragHover > 0}
        />
      </AttachmentWrapper>
    )
  }
  dragEnter (event) {
    this.setState(function (prevState) {
      return { dragHover: prevState.dragHover + 1 }
    })
  }
  dragLeave (event) {
    this.setState(function (prevState) {
      return { dragHover: prevState.dragHover - 1 }
    })
  }
  drop (event) {
    event.preventDefault()
    this.setState({ dragHover: false })
    if (this.props.attachment.readyForAction) {
      this.props.issue.uploadDroppedFiles(this.props.attachment)
    }
  }
}

Attachment.propTypes = {
  attachment: PropTypes.object.isRequired,
  issue: PropTypes.object.isRequired
}

/*
  The duplicated .attachment-delete-button is intentional. It makes the
  selector more specific, ensuring the display:block; takes precedence.
*/
const AttachmentWrapper = styled.div`
  margin-bottom: 16px;
  margin-left: 16px;
  &:nth-of-type(3n-1) {
    margin-left: 0px;
  }
  position: relative;
  &:hover {
    > .attachment-delete-button.attachment-delete-button {
      display: block;
    }
  }
`

@observer
class AttachmentCard extends Component {
  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.handleDeleteAction = this.handleDeleteAction.bind(this)
  }
  render () {
    var {attachment, dragHover} = this.props
    var imageMetadata = {
      id: attachment.id,
      mediaType: 'image',
      mimeType: attachment.mimeType,
      name: attachment.filename,
      size: attachment.size,
      creationDate: moment(attachment.created).valueOf()
    }
    // this is bit of a hack until CardView supports a downloading status
    if (attachment.downloading) {
      imageMetadata.name = 'Downloading...'
    }
    var style = {}
    var actions = []
    if (attachment.readyForAction) {
      if (dragHover) {
        style.padding = '0'
        style.border = '1px solid #FFAB00'
      }
      actions.push({
        label: 'Delete',
        type: 'delete',
        handler: this.handleDeleteAction
      })
    }
    return (
      <CardWrapper style={style} onClick={this.handleClick}>
        <CardView
          status={attachment.cardStatus}
          progress={attachment.progress}
          appearance='image'
          metadata={imageMetadata}
          dataURI={attachment.thumbnailDataUri}
          dimensions={{width: 141, height: 106}}
          resizeMode='full-fit'
          actions={actions}
        />
        {dragHover && (
          <ReplaceHover>
            <ReplaceLabel>
              <img src='replace.svg' alt='Replace' />
              <ReplaceLabelText>Replace</ReplaceLabelText>
            </ReplaceLabel>
          </ReplaceHover>
        )}
      </CardWrapper>
    )
  }
  handleClick (event) {
    event.preventDefault()
    this.props.attachment.open()
  }
  handleDeleteAction (event) {
    this.props.attachment.delete()
  }
}

AttachmentCard.propTypes = {
  attachment: PropTypes.object.isRequired,
  dragHover: PropTypes.bool.isRequired
}

const CardWrapper = styled.div`
  width: 141px;
  padding: 1px;
  position: relative;
`

const ReplaceHover = styled.div`
  display: flex;
  align-items: flex-end;
  width: 100%;
  height: 100%;
  z-index: 10;
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(9, 30, 66, 0.5);
  color: #FFFFFF;
`

const ReplaceLabel = styled.div`
  display: flex;
  align-items: center;
  padding: 0 0 7px 9px;
`
const ReplaceLabelText = styled.div`
  font-weight: 500;
  font-size: 16px;
  letter-spacing: -0.07;
  margin-left: 8px;
`

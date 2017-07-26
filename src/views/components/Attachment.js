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
    var style = {}
    return (
      <AttachmentWrapper
        style={style}
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
    this.setState({ dragHover: false })
    event.preventDefault()
    this.props.attachment.replace()
  }
}

Attachment.propTypes = {
  attachment: PropTypes.object.isRequired
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
    var style = {}
    if (this.props.dragHover) {
      style.padding = '0'
      style.border = '2px dashed #FF5630'
    }
    var attachment = this.props.attachment
    var imageMetadata = {
      id: attachment.id,
      mediaType: 'image',
      mimeType: attachment.mimeType,
      name: attachment.filename,
      size: attachment.size,
      creationDate: moment(attachment.created).valueOf()
    }
    var actions = [{
      label: 'Delete',
      type: 'delete',
      handler: this.handleDeleteAction
    }]
    return (
      <CardWrapper style={style} onClick={this.handleClick}>
        <CardView
          status={attachment.cardStatus}
          appearance='image'
          metadata={imageMetadata}
          dataURI={attachment.thumbnailDataUri}
          dimensions={{width: 141}}
          resizeMode='full-fit'
          actions={actions}
        />
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
  padding: 2px;
`

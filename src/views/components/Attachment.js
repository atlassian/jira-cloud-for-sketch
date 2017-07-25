import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import pluginCall from 'sketch-module-web-view/client'
import { CardView } from '@atlaskit/media-card'
import moment from 'moment'

export default class Attachment extends Component {
  constructor (props) {
    super(props)
    this.onAttachmentClick = this.onAttachmentClick.bind(this)
    this.onDeleteStarted = this.onDeleteStarted.bind(this)
    this.dragEnter = this.dragEnter.bind(this)
    this.dragLeave = this.dragLeave.bind(this)
    this.drop = this.drop.bind(this)
    this.state = {
      deleting: false,
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
          onClick={this.onAttachmentClick}
          dragHover={this.state.dragHover > 0}
          issueKey={this.props.issueKey}
          onDeleteStarted={this.props.onDeleteStarted}
        />
      </AttachmentWrapper>
    )
  }
  onAttachmentClick (event) {
    event.preventDefault()
    if (!this.state.deleting) {
      pluginCall(
        'openAttachment',
        this.props.issueKey,
        this.props.attachment.content,
        this.props.attachment.filename
      )
    }
  }
  onDeleteStarted () {
    this.setState({
      deleting: true
    })
    this.props.onDeleteStarted()
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
    if (!this.state.deleting) {
      pluginCall(
        'replaceAttachment',
        this.props.issueKey,
        this.props.attachment.id
      )
      this.onDeleteStarted() // hack - TODO refactor spinner logic
    }
  }
}

Attachment.propTypes = {
  issueKey: PropTypes.string.isRequired,
  attachment: PropTypes.object.isRequired,
  onDeleteStarted: PropTypes.func.isRequired
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

class AttachmentCard extends Component {
  constructor (props) {
    super(props)
    this.onThumbnailLoaded = this.onThumbnailLoaded.bind(this)
    this.state = {
      thumbnail: null,
      status: this.props.attachment.thumbnail ? 'loading' : 'complete'
    }
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
      handler: (item, event) => {
        this.props.onDeleteStarted()
        pluginCall(
          'deleteAttachment',
          this.props.issueKey,
          this.props.attachment.id
        )
        this.setState({
          status: 'processing'
        })
      }
    }]
    return (
      <CardWrapper style={style} onClick={this.props.onClick}>
        <CardView
          status={this.state.status}
          appearance='image'
          metadata={imageMetadata}
          dataURI={this.state.thumbnail}
          dimensions={{width: 141}}
          resizeMode='full-fit'
          actions={actions}
        />
      </CardWrapper>
    )
  }
  componentDidMount () {
    window.addEventListener('jira.attachment.thumbnail', this.onThumbnailLoaded)
  }
  componentWillUnmount () {
    window.removeEventListener(
      'jira.attachment.thumbnail',
      this.onThumbnailLoaded
    )
  }
  onThumbnailLoaded (event) {
    if (event.detail.id == this.props.attachment.id) {
      this.setState({
        thumbnail: event.detail.dataUri,
        status: 'complete'
      })
    }
  }
}

AttachmentCard.propTypes = {
  issueKey: PropTypes.string.isRequired,
  attachment: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
  dragHover: PropTypes.bool.isRequired,
  onDeleteStarted: PropTypes.func.isRequired
}

const CardWrapper = styled.div`
  width: 141px;
  padding: 2px;
`

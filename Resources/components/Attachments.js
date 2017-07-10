import React, { Component } from 'react'
import PropTypes from 'prop-types'
import DropZone from './DropZone'
import styled from 'styled-components'
import pluginCall from 'sketch-module-web-view/client'
import DocumentIcon from '@atlaskit/icon/glyph/document'
import Spinner from '@atlaskit/spinner'
import moment from 'moment'
import filesize from 'filesize'

export default class Attachments extends Component {
  constructor (props) {
    super(props)
    this.reloadAttachments = this.reloadAttachments.bind(this)
    this.onDetailsLoaded = this.onDetailsLoaded.bind(this)
    this.onUploadStarted = this.onUploadStarted.bind(this)
    this.onUploadComplete = this.onUploadComplete.bind(this)
    this.deltaState = this.deltaState.bind(this)
    this.state = {
      attachments: [],
      thumbs: {},
      uploading: 0,
      downloading: 0
    }
  }
  render () {
    var loading = this.state.uploading || this.state.downloading
    return (
      <AttachmentsArea>
        <AttachmentsHeader>
          <h4>Attachments</h4>
          <SpinnerWrapper>
            <Spinner size='small' isCompleting={!loading} />
          </SpinnerWrapper>
        </AttachmentsHeader>
        <DropZone
          issueKey={this.props.issueKey}
          onUploadStarted={this.onUploadStarted}
          onUploadComplete={this.onUploadComplete}
        />
        {this.state.attachments.map(attachment => (
          <Attachment key={attachment.id} attachment={attachment} />
        ))}
      </AttachmentsArea>
    )
  }
  componentDidMount () {
    window.addEventListener('jira.attachment.details', this.onDetailsLoaded)
    this.reloadAttachments()
  }
  componentWillUnmount () {
    window.removeEventListener('jira.attachment.details', this.onDetailsLoaded)
  }
  reloadAttachments () {
    pluginCall('loadAttachments', this.props.issueKey)
    this.deltaState('downloading', +1)
  }
  onDetailsLoaded (event) {
    if (event.detail.issueKey == this.props.issueKey) {
      this.setState({
        attachments: event.detail.attachments
      })
      this.deltaState('downloading', -1)
    }
  }
  onUploadStarted (n) {
    this.deltaState('uploading', n)
  }
  onUploadComplete (n) {
    this.deltaState('uploading', -n)
    this.reloadAttachments()
  }
  deltaState (property, delta) {
    this.setState(function (prevState) {
      return { [property]: prevState[property] + delta }
    })
  }
}

const AttachmentsArea = styled.div`
  padding-top: 10px;
  padding-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-content: flex-start;
`

const AttachmentsHeader = styled.div`
  width: 100%;
  maring-bottom: 5px;
  display: flex;
  justify-content: flex-start;
  align-content: center;
`

const SpinnerWrapper = styled.div`
  margin-left: 5px;
  height: 25px;
`

Attachments.propTypes = {
  issueKey: PropTypes.string.isRequired
}

class Attachment extends Component {
  constructor (props) {
    super(props)
    this.handleClick = handleAttachmentClick.bind(this)
  }
  render () {
    var attachment = this.props.attachment
    return (
      <AttachmentWrapper>
        <AttachmentThumbnail attachment={attachment} />
        <AttachmentFilename>
          <a href={attachment.content} onClick={this.handleClick}>
            {attachment.filename}
          </a>
        </AttachmentFilename>
        <AttachmentDetailWrapper>
          <div>
            {moment(attachment.created).fromNow()}
          </div>
          <div>
            {filesize(attachment.size, { round: 0 })}
          </div>
        </AttachmentDetailWrapper>
      </AttachmentWrapper>
    )
  }
}

function handleAttachmentClick (event) {
  event.preventDefault()
  pluginCall(
    'openAttachment',
    this.props.attachment.content,
    this.props.attachment.filename
  )
}

Attachment.propTypes = {
  attachment: PropTypes.object.isRequired
}

const AttachmentWrapper = styled.div`
  margin-right: 3px;
  margin-bottom: 3px;
  &:nth-child(3n) {
    margin-right: 0px;
  }
`

const AttachmentFilename = styled.div`
  color: #7a869a;
  font-size: 12px;
  width: 128px;
  padding: 2px 3px 0 3px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const AttachmentDetailWrapper = styled.div`
  color: #7a869a;
  font-size: 10px;
  width: 128px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px;
`

class AttachmentThumbnail extends Component {
  constructor (props) {
    super(props)
    this.onThumbnailLoaded = this.onThumbnailLoaded.bind(this)
    this.handleClick = handleAttachmentClick.bind(this)
    this.state = {
      thumbnail: null
    }
  }
  render () {
    return (
      <ThumbnailWrapper onClick={this.handleClick}>
        {this.state.thumbnail ? (
          <ThumbnailImage
            src={this.state.thumbnail}
            alt={this.props.attachment.filename}
            title={this.props.attachment.filename}
            />
         ) : (
           <DocumentIcon
             label={this.props.attachment.filename}
             size='large'
            />
         )}
      </ThumbnailWrapper>
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
        thumbnail: event.detail.dataUri
      })
    }
  }
}

AttachmentThumbnail.propTypes = {
  attachment: PropTypes.object.isRequired
}

const ThumbnailWrapper = styled.div`
  width: 128px;
  height: 96px;
  color: #c1c7d0;
  background-color: #f2f2f2;
  border: 1px solid gray;
  border-radius: 3px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  overflow: hidden;
  cursor: pointer;
`

const ThumbnailImage = styled.img`
  max-width: 128px;
  max-height: 96px;
`

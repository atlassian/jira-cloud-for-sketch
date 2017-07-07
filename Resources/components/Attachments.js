import React, { Component } from 'react'
import PropTypes from 'prop-types'
import DropZone from './DropZone'
import styled from 'styled-components'
import pluginCall from 'sketch-module-web-view/client'
import DocumentIcon from '@atlaskit/icon/glyph/document'
import filesize from 'filesize'

export default class Attachments extends Component {
  constructor (props) {
    super(props)
    this.onDetailsLoaded = this.onDetailsLoaded.bind(this)
    this.state = {
      loading: true,
      attachments: [],
      thumbs: {}
    }
  }
  render () {
    return (
      <AttachmentsArea>
        <DropZone issueKey={this.props.issueKey} />
        {this.state.loading ? (
          <LoadingDiv>
            <div>Loading attachments...</div>
          </LoadingDiv>
        ) : this.state.attachments.map(attachment => (
          <Attachment key={attachment.id} attachment={attachment} />
        ))}
      </AttachmentsArea>
    )
  }
  componentDidMount () {
    window.addEventListener('jira.attachment.details', this.onDetailsLoaded)
    pluginCall('loadAttachments', this.props.issueKey)
  }
  componentWillUnmount () {
    window.removeEventListener('jira.attachment.details', this.onDetailsLoaded)
  }
  onDetailsLoaded (event) {
    if (event.detail.issueKey == this.props.issueKey) {
      this.setState({
        attachments: event.detail.attachments,
        loading: false
      })
    }
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

const LoadingDiv = styled.div`
  color: #7a869a;
  font-size: 12px;
  margin-left: 25px;
  height: 128px;
  display: flex;
  align-items: center;
  justify-content: space-around;
`

Attachments.propTypes = {
  issueKey: PropTypes.string.isRequired
}

class Attachment extends Component {
  render () {
    var attachment = this.props.attachment
    return (
      <AttachmentWrapper>
        <AttachmentThumbnail attachment={attachment} />
        <AttachmentFilename>{attachment.filename}</AttachmentFilename>
        <AttachmentDetailWrapper>
          <div>Sometime</div>
          <div>{filesize(attachment.size, {round: 0})}</div>
        </AttachmentDetailWrapper>
      </AttachmentWrapper>
    )
  }
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
    this.state = {
      thumbnail: null
    }
  }
  render () {
    return (
      <ThumbnailWrapper>
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
    window.addEventListener(
      'jira.attachment.thumbnail',
      this.onThumbnailLoaded
    )
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
`

const ThumbnailImage = styled.img`
  max-width: 128px;
  max-height: 96px;
`

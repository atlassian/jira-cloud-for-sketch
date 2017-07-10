import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import pluginCall from 'sketch-module-web-view/client'
import DocumentIcon from '@atlaskit/icon/glyph/document'
import RemoveIcon from '@atlaskit/icon/glyph/remove'
import moment from 'moment'
import filesize from 'filesize'

export default class Attachment extends Component {
  constructor (props) {
    super(props)
    this.onAttachmentClick = this.onAttachmentClick.bind(this)
    this.onDeleteStarted = this.onDeleteStarted.bind(this)
    this.state = {
      deleting: false
    }
  }
  render () {
    var attachment = this.props.attachment
    var style = {}
    if (this.state.deleting) {
      style.opacity = '0.3'
    }
    var created = moment(attachment.created)
    return (
      <AttachmentWrapper style={style}>
        <AttachmentThumbnail
          attachment={attachment}
          onClick={this.onAttachmentClick}
        />
        <AttachmentFilename>
          <a href={attachment.content} onClick={this.onAttachmentClick}>
            {attachment.filename}
          </a>
        </AttachmentFilename>
        <AttachmentDetailWrapper>
          <div title={created.format('LLL')}>
            {created.fromNow()}
          </div>
          <div>
            {filesize(attachment.size, { round: 0 })}
          </div>
        </AttachmentDetailWrapper>
        {!this.state.deleting && (
          <AttachmentDeleteButton
            issueKey={this.props.issueKey}
            attachment={this.props.attachment}
            onDeleteStarted={this.onDeleteStarted}
          />
        )}
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
  margin-right: 3px;
  margin-bottom: 3px;
  &:nth-child(3n) {
    margin-right: 0px;
  }
  position: relative;
  &:hover {
    > .attachment-delete-button.attachment-delete-button {
      display: block;
    }
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
      <ThumbnailWrapper onClick={this.props.onClick}>
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
  attachment: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired
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

class AttachmentDeleteButton extends Component {
  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }
  render () {
    return (
      <DeleteButtonWrapper
        className='attachment-delete-button'
        onClick={this.handleClick}
      >
        <RemoveIcon label='Delete attachment' size='small' />
      </DeleteButtonWrapper>
    )
  }
  handleClick (event) {
    event.preventDefault()
    this.props.onDeleteStarted()
    pluginCall(
      'deleteAttachment',
      this.props.issueKey,
      this.props.attachment.id
    )
  }
}

AttachmentDeleteButton.propTypes = {
  issueKey: PropTypes.string.isRequired,
  attachment: PropTypes.object.isRequired,
  onDeleteStarted: PropTypes.func.isRequired
}

const DeleteButtonWrapper = styled.div`
  display: none;
  position: absolute;
  right: 8px;
  top: 4px;
  width: 16px;
  height: 16px;
  background-color: #f2f2f2;
  cursor: pointer;
`

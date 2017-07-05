import React, { Component } from 'react'
import PropTypes from 'prop-types'
import DropZone from './DropZone'
import styled from 'styled-components'
import pluginCall from 'sketch-module-web-view/client'

export default class Attachments extends Component {
  constructor (props) {
    super(props)
    this.onDetailsLoaded = this.onDetailsLoaded.bind(this)
    this.onThumbnailLoaded = this.onThumbnailLoaded.bind(this)
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
        { this.state.loading && (
          <span>Loading attachments...</span>
        )}
        { !this.state.loading && this.state.attachments.map((attachment) => (
          <AttachmentDiv style={this.state.thumbs[attachment.id] ? {
            backgroundImage: `url("${this.state.thumbs[attachment.id]}")`
          } : null}>
            <span>{attachment.filename}</span>
          </AttachmentDiv>
        )) }
      </AttachmentsArea>
    )
  }
  componentDidMount () {
    window.addEventListener('jira.attachment.details', this.onDetailsLoaded)
    window.addEventListener('jira.attachment.thumbnail', this.onThumbnailLoaded)
    pluginCall('loadAttachments', this.props.issueKey)
  }
  componentWillUnmount () {
    window.removeEventListener('jira.attachment.details', this.onDetailsLoaded)
    window.removeEventListener('jira.attachment.thumbnail', this.onThumbnailLoaded)
  }
  onDetailsLoaded (event) {
    if (event.detail.issueKey == this.props.issueKey) {
      this.setState({
        attachments: event.detail.attachments,
        loading: false
      })
    }
  }
  onThumbnailLoaded (event) {
    if (event.detail.issueKey == this.props.issueKey) {
      this.setState(function (prevState) {
        const thumbs = prevState.thumbs
        thumbs[event.detail.id] = event.detail.dataUri
        return { thumbs }
      })
    }
  }
}

Attachments.propTypes = {
  issueKey: PropTypes.string.isRequired
}

const AttachmentsArea = styled.div`
  padding-top: 10px;
  padding-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-content: flex-start;
  align-items: center;
`

const AttachmentDiv = styled.div`
  display: flex;
  align-items: flex-end;
  text-align: center;
  justify-content: space-around;
  color: #7a869a;
  font-size: 12px;
  width: 128px;
  height: 96px;
  margin-right: 3px;
  margin-bottom: 3px;
  padding: 3px;
  border: 1px solid gray;
  border-radius: 3px;
  word-break: break-all;
  background-position: center;
  background-repeat: no-repeat;

  &:nth-child(3n) {
    margin-right: 0px;
  }
`

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import DropZone from './DropZone'
import styled from 'styled-components'
import pluginCall from 'sketch-module-web-view/client'
import Attachment from './Attachment'

export default class Attachments extends Component {
  constructor (props) {
    super(props)
    this.reloadAttachments = this.reloadAttachments.bind(this)
    this.onAttachmentsReloaded = this.onAttachmentsReloaded.bind(this)
    this.onUploadStarted = this.onUploadStarted.bind(this)
    this.onUploadComplete = this.onUploadComplete.bind(this)
    this.onDeleteStarted = this.onDeleteStarted.bind(this)
    this.onAttachmentDownloading = this.onAttachmentDownloading.bind(this)
    this.onAttachmentOpened = this.onAttachmentOpened.bind(this)
    this.deltaState = this.deltaState.bind(this)
    this.state = {
      attachments: this.props.issue.fields.attachment,
      thumbs: {},
      tasks: 0
    }
  }
  render () {
    return (
      <AttachmentsArea>
        <DropZone
          issueKey={this.props.issue.key}
          onUploadStarted={this.onUploadStarted}
          onUploadComplete={this.onUploadComplete}
        />
        {this.state.attachments.map(attachment => (
          <Attachment
            key={attachment.id}
            issueKey={this.props.issue.key}
            attachment={attachment}
            onDeleteStarted={this.onDeleteStarted}
          />
        ))}
      </AttachmentsArea>
    )
  }
  componentDidMount () {
    window.addEventListener('jira.attachment.reloaded', this.onAttachmentsReloaded)
    window.addEventListener('jira.attachment.downloading', this.onAttachmentDownloading)
    window.addEventListener('jira.attachment.opened', this.onAttachmentOpened)
    this.reloadAttachments()
  }
  componentWillUnmount () {
    window.removeEventListener('jira.attachment.reloaded', this.onAttachmentsReloaded)
    window.removeEventListener('jira.attachment.downloading', this.onAttachmentDownloading)
    window.removeEventListener('jira.attachment.opened', this.onAttachmentOpened)
  }
  reloadAttachments () {
    pluginCall('reloadAttachments', this.props.issue.key)
    this.deltaState('tasks', 1)
  }
  onAttachmentsReloaded (event) {
    if (event.detail.issueKey == this.props.issue.key) {
      this.setState({
        attachments: event.detail.attachments
      })
      this.deltaState('tasks', -1)
    }
  }
  onAttachmentDownloading (event) {
    if (event.detail.issueKey == this.props.issue.key) {
      this.deltaState('tasks', 1)
    }
  }
  onAttachmentOpened (event) {
    if (event.detail.issueKey == this.props.issue.key) {
      this.deltaState('tasks', -1)
    }
  }
  onUploadStarted (n) {
    this.deltaState('tasks', n)
  }
  onUploadComplete (n) {
    this.deltaState('tasks', -n)
    this.reloadAttachments()
  }
  onDeleteStarted () {
    this.deltaState('tasks', 1)
    // tasks will be decremented by onAttachmentsReloaded after attachment list refreshes
  }
  deltaState (property, delta) {
    this.setState(function (prevState) {
      return { [property]: prevState[property] + delta }
    })
  }
}

const AttachmentsArea = styled.div`
  padding-top: 10px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-content: flex-start;
`

Attachments.propTypes = {
  issue: PropTypes.object.isRequired
}

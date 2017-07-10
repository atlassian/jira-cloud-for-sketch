import React, { Component } from 'react'
import PropTypes from 'prop-types'
import DropZone from './DropZone'
import styled from 'styled-components'
import pluginCall from 'sketch-module-web-view/client'
import Spinner from '@atlaskit/spinner'
import Attachment from './Attachment'

export default class Attachments extends Component {
  constructor (props) {
    super(props)
    this.reloadAttachments = this.reloadAttachments.bind(this)
    this.onDetailsLoaded = this.onDetailsLoaded.bind(this)
    this.onUploadStarted = this.onUploadStarted.bind(this)
    this.onUploadComplete = this.onUploadComplete.bind(this)
    this.onDeleteStarted = this.onDeleteStarted.bind(this)
    this.onAttachmentDownloading = this.onAttachmentDownloading.bind(this)
    this.onAttachmentOpened = this.onAttachmentOpened.bind(this)
    this.deltaState = this.deltaState.bind(this)
    this.state = {
      attachments: [],
      thumbs: {},
      tasks: 0
    }
  }
  render () {
    return (
      <AttachmentsArea>
        <AttachmentsHeader>
          <h4>Attachments</h4>
          <SpinnerWrapper>
            <Spinner size='small' isCompleting={!this.state.tasks} />
          </SpinnerWrapper>
        </AttachmentsHeader>
        <DropZone
          issueKey={this.props.issueKey}
          onUploadStarted={this.onUploadStarted}
          onUploadComplete={this.onUploadComplete}
        />
        {this.state.attachments.map(attachment => (
          <Attachment
            key={attachment.id}
            issueKey={this.props.issueKey}
            attachment={attachment}
            onDeleteStarted={this.onDeleteStarted}
          />
        ))}
      </AttachmentsArea>
    )
  }
  componentDidMount () {
    window.addEventListener('jira.attachment.details', this.onDetailsLoaded)
    window.addEventListener('jira.attachment.downloading', this.onAttachmentDownloading)
    window.addEventListener('jira.attachment.opened', this.onAttachmentOpened)
    this.reloadAttachments()
  }
  componentWillUnmount () {
    window.removeEventListener('jira.attachment.details', this.onDetailsLoaded)
    window.removeEventListener('jira.attachment.downloading', this.onAttachmentDownloading)
    window.removeEventListener('jira.attachment.opened', this.onAttachmentOpened)
  }
  reloadAttachments () {
    pluginCall('loadAttachments', this.props.issueKey)
    this.deltaState('tasks', 1)
  }
  onDetailsLoaded (event) {
    if (event.detail.issueKey == this.props.issueKey) {
      this.setState({
        attachments: event.detail.attachments
      })
      this.deltaState('tasks', -1)
    }
  }
  onAttachmentDownloading (event) {
    if (event.detail.issueKey == this.props.issueKey) {
      this.deltaState('tasks', 1)
    }
  }
  onAttachmentOpened (event) {
    if (event.detail.issueKey == this.props.issueKey) {
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
    // tasks will be decremented by onDetailsLoaded after attachment list refreshes
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

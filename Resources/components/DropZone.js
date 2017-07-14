import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import pluginCall from 'sketch-module-web-view/client'
import '@atlaskit/css-reset'

export default class DropZone extends Component {
  constructor (props) {
    super(props)
    this.onUploadQueued = this.onUploadQueued.bind(this)
    this.onUploadComplete = this.onUploadComplete.bind(this)
    this.dragEnter = this.dragEnter.bind(this)
    this.dragLeave = this.dragLeave.bind(this)
    this.dragStart = this.dragStart.bind(this)
    this.drop = this.drop.bind(this)
    this.state = {
      /*
      Tracks whether the user is currently dragging an item over the DropZone.
      Since children of the DropZone trigger their own drag events, we keep a
      count of dragEnter vs dragLeave and remove the drag hover effect when the
      counter falls to zero.
      */
      dragHover: 0,
      uploading: 0
    }
  }
  componentDidMount () {
    window.addEventListener('jira.upload.queued', this.onUploadQueued)
    window.addEventListener('jira.upload.complete', this.onUploadComplete)
  }
  componentWillUnmount () {
    window.removeEventListener('jira.upload.queued', this.onUploadQueued)
    window.removeEventListener('jira.upload.complete', this.onUploadComplete)
  }
  onUploadQueued (event) {
    if (event.detail.issueKey == this.props.issueKey) {
      this.setState(function (prevState) {
        return {
          uploading: prevState.uploading + event.detail.count
        }
      })
      this.props.onUploadStarted(event.detail.count)
    }
  }
  onUploadComplete (event) {
    if (event.detail.issueKey == this.props.issueKey) {
      this.setState(function (prevState) {
        return {
          uploading: prevState.uploading - event.detail.count
        }
      })
      this.props.onUploadComplete(event.detail.count)
    }
  }
  dragEnter (event) {
    this.setState(function (prevState) {
      return { dragHover: prevState.dragHover + 1 }
    })
    // event.dataTransfer.dropEffect = "copy"
  }
  dragLeave (event) {
    this.setState(function (prevState) {
      return { dragHover: prevState.dragHover - 1 }
    })
  }
  dragStart (event) {
    // event.dataTransfer.effectAllowed = "copy"
  }
  drop (event) {
    this.setState({ dragHover: false })
    /*
    Dragged files are looked up from the system pasteboard so we can determine
    their location on disk. We only pass back the issue they were dropped onto.
    */
    pluginCall('uploadDroppedFiles', this.props.issueKey)
    event.preventDefault()
  }
  render (props) {
    var style = {}
    if (this.state.dragHover > 0) {
      style.borderWidth = '3px'
      style.padding = '2px'
      style.borderColor = '#ffab00'
    }
    var text = 'Drag your artboards and layers here'
    if (this.state.uploading > 0) {
      text = 'Uploading...'
    }
    return (
      <DropZoneDiv
        style={style}
        onDragEnter={this.dragEnter}
        onDragLeave={this.dragLeave}
        onDragStart={this.dragStart}
        onDragOver={(event) => { event.preventDefault() }}
        onDropCapture={this.drop}
      >
        <DocumentsImg src='documents.png' alt='Documents' />
        <TextDiv>{text}</TextDiv>
      </DropZoneDiv>
    )
  }
}

DropZone.propTypes = {
  issueKey: PropTypes.string.isRequired,
  onUploadStarted: PropTypes.func.isRequired,
  onUploadComplete: PropTypes.func.isRequired
}

const DropZoneDiv = styled.div`
  height: 64px;
  width: 456px;
  margin-bottom: 16px;
  padding: 3px;
  border-radius: 3px;
  border-style: dashed;
  border-width: 2px;
  border-color: #C1C7D0;
  display: flex;
  align-items: center;
  justify-content: center;
`

const DocumentsImg = styled.img`
  width: 48px;
`

const TextDiv = styled.div`
  margin-left: 8px;
  color: #7a869a;
  font-size: 12px;
`

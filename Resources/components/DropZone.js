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
      Since children of the DropZone trigger their own drag events,
      we keep a count of dragEnter vs dragLeave and remove the drag hover effect
      when the counter falls to zero.
      */
      dragHover: 0,
      uploadsComplete: 0,
      uploadsTotal: 0
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
        if (prevState.uploadsTotal == prevState.uploadsComplete) {
          // if all pending uploads are complete, reset the counters
          return {
            uploadsTotal: event.detail.count,
            uploadsComplete: 0
          }
        } else {
          // otherwise update the current total
          return {
            uploadsTotal: prevState.uploadsTotal + event.detail.count
          }
        }
      })
      this.props.onUploadStarted(event.detail.count)
    }
  }
  onUploadComplete (event) {
    if (event.detail.issueKey == this.props.issueKey) {
      this.setState(function (prevState) {
        return {
          uploadsComplete: prevState.uploadsComplete + event.detail.count
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
    var style = {
      height: '128px',
      width: '122px',
      marginRight: '7px',
      marginBottom: '3px',
      padding: '3px',
      borderRadius: '3px',
      borderStyle: 'dashed',
      borderWidth: '1px',
      borderColor: 'gray',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around'
    }
    if (this.state.dragHover > 0) {
      style.borderWidth = '3px'
      style.padding = '1px'
      style.borderColor = '#ffab00'
    }
    var text
    if (this.state.uploadsTotal == 0) {
      text = 'Drag artboards and layers here to upload'
    } else if (this.state.uploadsComplete == this.state.uploadsTotal) {
      if (this.state.uploadsComplete == 1) {
        text = 'Uploaded 1 file'
      } else {
        text = `Uploaded ${this.state.uploadsTotal} files`
      }
    } else {
      if (this.state.uploadsTotal == 1) {
        text = 'Uploading 1 file...'
      } else {
        text = `Uploading ${this.state.uploadsComplete + 1} of ${this.state.uploadsTotal} files...`
      }
    }
    return (
      <div
        style={style}
        onDragEnter={this.dragEnter}
        onDragLeave={this.dragLeave}
        onDragStart={this.dragStart}
        onDragOver={(event) => { event.preventDefault() }}
        onDropCapture={this.drop}
      >
        <TextDiv>{text}</TextDiv>
      </div>
    )
  }
}

DropZone.propTypes = {
  issueKey: PropTypes.string.isRequired,
  onUploadStarted: PropTypes.func.isRequired,
  onUploadComplete: PropTypes.func.isRequired
}

const TextDiv = styled.div`
  color: #7a869a;
  font-size: 12px;
  width: 100px;
  text-align: center;
`

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import AddIcon from '@atlaskit/icon/glyph/add'
import '@atlaskit/css-reset'

export default class DropZone extends Component {
  constructor (props) {
    super(props)
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
    window.addEventListener('jira.upload.queued', event => {
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
      }
    })
    window.addEventListener('jira.upload.complete', event => {
      if (event.detail.issueKey == this.props.issueKey) {
        this.setState(function (prevState) {
          return {
            uploadsComplete: prevState.uploadsComplete + event.detail.count
          }
        })
      }
    })
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
    this.props.onDrop(event)
    this.setState({ dragHover: false })
    event.preventDefault()
  }
  preventDefault (event) {
    event.preventDefault()
  }
  render (props) {
    var style = {
      height: '40px',
      marginTop: '10px',
      padding: '3px',
      borderRadius: '3px',
      borderStyle: 'dashed',
      borderWidth: '1px',
      borderColor: 'gray',
      display: 'flex',
      alignItems: 'center'
    }
    if (this.state.dragHover > 0) {
      style.borderWidth = '3px'
      style.padding = '1px'
      style.borderColor = '#ffab00'
    }
    var text
    if (this.state.uploadsTotal == 0) {
      text = 'Drag artboards and layers here'
    } else if (this.state.uploadsComplete == this.state.uploadsTotal) {
      if (this.state.uploadsComplete == 1) {
        text = 'Uploaded 1 file'
      } else {
        text = `Uploaded ${this.state.uploadsComplete} of ${this.state.uploadsTotal} files`
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
        onDragOver={this.preventDefault}
        onDropCapture={this.drop}
      >
        <AddIconWrapper>
          <AddIcon size='medium' color='#7a869a' label='Upload to JIRA' />
        </AddIconWrapper>
        <TextDiv>{text}</TextDiv>
      </div>
    )
  }
}

DropZone.propTypes = {
  issueKey: PropTypes.string.isRequired,
  onDrop: PropTypes.func.isRequired
}

const AddIconWrapper = styled.div`
  width: 39px;
  height: 39px;
  background-color: #b7b7b7;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-radius: 3px;
`

const TextDiv = styled.div`
  margin-left: 10px;
  color: #7a869a;
  font-size: 12px;
`

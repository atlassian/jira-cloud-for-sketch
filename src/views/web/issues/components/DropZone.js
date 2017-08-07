import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import '@atlaskit/css-reset'

@observer
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
      Since children of the DropZone trigger their own drag events, we keep a
      count of dragEnter vs dragLeave and remove the drag hover effect when the
      counter falls to zero.
      */
      dragHover: 0
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
    event.preventDefault()
    this.setState({ dragHover: false })
    /*
    Dragged files are looked up from the system pasteboard so we can determine
    their location on disk. No need to pass them here.
    */
    this.props.issue.uploadDroppedFiles()
  }
  render (props) {
    var style = {}
    if (this.state.dragHover > 0) {
      style.borderWidth = '3px'
      style.padding = '2px'
      style.borderColor = '#ffab00'
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
        <DocumentsImg src='upload.png' alt='Upload' />
        <TextDiv>Drag your <strong>artboards</strong> and <strong>layers</strong> here</TextDiv>
      </DropZoneDiv>
    )
  }
}

DropZone.propTypes = {
  issue: PropTypes.object.isRequired
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

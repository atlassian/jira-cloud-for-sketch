import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import '@atlaskit/css-reset'

export default class DropZone extends Component {
  constructor (props) {
    super(props)
    this.dragEnter = this.dragEnter.bind(this)
    this.dragLeave = this.dragLeave.bind(this)
    this.dragStart = this.dragStart.bind(this)
    this.drop = this.drop.bind(this)
    this.state = {
      dragHover: false
    }
  }
  dragEnter (event) {
    this.setState({ dragHover: true })
    // event.dataTransfer.dropEffect = "copy"
  }
  dragLeave (event) {
    this.setState({ dragHover: false })
  }
  dragStart (event) {
    // event.dataTransfer.effectAllowed = "copy"
  }
  drop (event) {
    var files = event.dataTransfer.files
    console.log(event.dataTransfer)
    for (var i = 0; i < files.length; i++) {
      console.log(`File ${i}: ${files[i].name} ${files[i].size}`)
    }
    this.setState({ dragHover: false })
    event.preventDefault()
  }
  preventDefault (event) {
    event.preventDefault()
  }
  render (props) {
    var style = {
      height: '40px',
      textAlign: 'center',
      marginTop: '10px',
      padding: '5px',
      borderRadius: '3px',
      borderStyle: 'dashed',
      borderWidth: '1px',
      borderColor: 'gray',
      display: 'flex',
      alignItems: 'center'
    }
    if (this.state.dragHover) {
      style.color = '#707070'
      style.borderWidth = '3px'
      style.padding = '3px'
      style.borderColor = '#ffab00'
    }
    return (
      <div
        draggable='true'
        style={style}
        onDragEnter={this.dragEnter}
        onDragLeave={this.dragLeave}
        onDragStart={this.dragStart}
        onDragOver={this.preventDefault}
        onDropCapture={this.drop}
      >
        <div>Drag artboards and layers here</div>
      </div>
    )
  }
}

import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import pluginCall from 'sketch-module-web-view/client'
import styled from 'styled-components'

class DropZone extends Component {
  constructor(props) {
    super(props)
    this.dragEnter = this.dragEnter.bind(this)
    this.dragLeave = this.dragLeave.bind(this)
    this.dragStart = this.dragStart.bind(this)
    this.drop = this.drop.bind(this)
    this.state = {
      dragHover: false
    }
  }
  dragEnter(event) {
    this.setState({dragHover: true})
    // event.dataTransfer.dropEffect = "copy"
  }
  dragLeave(event) {
    this.setState({dragHover: false})
  }
  dragStart(event) {
    // event.dataTransfer.effectAllowed = "copy"
  }
  drop(event) {
    var files = event.dataTransfer.files
    console.log(event.dataTransfer)
    for (var i = 0; i < files.length; i++) {
        console.log(" File " + i + ":\n(" + (typeof files[i]) + ") : <" + files[i] + " > " +
          files[i].name + " " + files[i].size + "\n")
    }
    this.setState({dragHover: false})
    event.preventDefault()
  }
  preventDefault(event) {
    event.preventDefault()
  }
  render(props) {
    var style = {
        height: "160px",
        textAlign: "center"
    }
    if (this.state.dragHover) {
      style.backgroundColor = "cyan"
    }
    return (
      <div
        draggable='true'
        style={style}
        onDragEnter={this.dragEnter}
        onDragLeave={this.dragLeave}
        onDragStart={this.dragStart}
        onDragOver={this.preventDefault}
        onDropCapture={this.drop}>Drop here!
      </div>
    )
  }
}

ReactDOM.render(<DropZone />, document.getElementById('container'))

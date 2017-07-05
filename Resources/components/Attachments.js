import React, { Component } from 'react'
import PropTypes from 'prop-types'
import DropZone from './DropZone'
import styled from 'styled-components'

export default class Attachments extends Component {
  render () {
    return (
      <DropZone issueKey={this.props.issueKey} />
    )
  }
}

Attachments.propTypes = {
  issueKey: PropTypes.string.isRequired
}

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import DropZone from './DropZone'
import styled from 'styled-components'
import Attachment from './Attachment'

@observer
export default class Attachments extends Component {
  render () {
    const issue = this.props.issue
    return (
      <AttachmentsArea>
        <DropZone issue={issue} />
        {issue.attachments.map(attachment => (
          attachment.visible &&
            <Attachment
              key={attachment.id}
              attachment={attachment}
              issue={issue}
            />
        ))}
      </AttachmentsArea>
    )
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

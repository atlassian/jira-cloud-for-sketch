import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import Avatar from '@atlaskit/avatar'
import styled from 'styled-components'
import '@atlaskit/css-reset'

@observer
export default class AssigneeAvatar extends Component {
  render () {
    var assignee = this.props.assignee
    var avatarUrl, title
    if (assignee) {
      avatarUrl = assignee.avatarUrls['24x24']
      title = `Assigned to ${assignee.displayName || assignee.name}`
    } else {
      title = 'Unassigned'
    }
    return (
      <AvatarDiv>
        <AvatarWrapper title={title}>
          <Avatar src={avatarUrl} size='small' label={title} />
        </AvatarWrapper>
      </AvatarDiv>
    )
  }
}

AssigneeAvatar.propTypes = {
  /*
  {
    "self": "https://jira.example.com/rest/api/2/user?username=admin",
    "name": "admin",
    "key": "admin",
    "accountId": "xxxxxxxx",
    "emailAddress": "example@example.com",
    "avatarUrls": {
      "48x48": "https://...",
      "24x24": "https://...",
      "16x16": "https://...",
      "32x32": "https://..."
    },
    "displayName": "Tim Pettersen",
    "active": true,
    "timeZone": "Australia/Sydney"
  }
  */
  assignee: PropTypes.object
}

const AvatarDiv = styled.div`
  width: 24px;
`

const AvatarWrapper = styled.div`
  margin-top: 5px;
  margin-right: 5px;
`

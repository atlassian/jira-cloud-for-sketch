import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import pluginCall from 'sketch-module-web-view/client'
import { Button, Text, TextInput, View  } from 'react-desktop/macOs';
import styled from 'styled-components'

class Connect extends Component {
  render () {
    return (
      <div style={{padding: '0 20px 20px 20px'}}>
        <Text paddingBottom="10px">
          <b>Connect to JIRA Cloud</b>
        </Text>
        <Text>
          Authorize Sketch to interact with JIRA on your behalf.
        </Text>
        <br />
        <TextInput
          label="JIRA Cloud URL"
          placeholder="sketchfan.atlassian.net"
          ref={(input) => {
            this.textInput = input;
          }}
          defaultValue=""
          onChange={(event) => this.setState({jiraUrl: event.target.value})}
          style={{
            /* work around default style applied by jsdom which breaks the TextInput */
            "-webkit-user-select": "text"
          }}
          autoFocus
        />
        <br />
        <div style={{width: "100%", textAlign: "right"}}>
          <Button onClick={() => pluginCall('cancel')}>
            Cancel
          </Button>
          <Button style={{marginLeft: "15px"}} color="blue" onClick={() => pluginCall('connectToJira', this.state.jiraUrl)}>
            Connect
          </Button>
        </div>
      </div>
    )
  }
}

ReactDOM.render(<Connect />, document.getElementById('container'))

import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import pluginCall from 'sketch-module-web-view/client'
import AkFieldText from '@atlaskit/field-text'
import ButtonGroup from '@atlaskit/button-group'
import Button from '@atlaskit/button'
import styled from 'styled-components'
import '@atlaskit/css-reset'

class Connect extends Component {
  render () {
    return (
      <FormWrapper className='connect'>
        <h3>Connect to JIRA Cloud</h3>
        <p>
          Enter your JIRA Cloud details to connect the Sketch plugin.
        </p>
        <AkFieldText
          ref={jiraUrl => {
            this.jiraUrl = jiraUrl
          }}
          placeholder='sketchfan.atlassian.net'
          label='JIRA Cloud URL'
          onChange={event => this.setState({ jiraUrl: event.target.value })}
          shouldFitContainer
        />
        <br />
        <ButtonGroup>
          <Button
            appearance='primary'
            type='submit'
            onClick={() => pluginCall('connectToJira', this.state.jiraUrl)}
          >
            Connect
          </Button>
          <Button appearance='subtle-link' onClick={() => pluginCall('cancel')}>
            Cancel
          </Button>
        </ButtonGroup>
        <SubtleText>
          After clicking Connect, you'll be asked to authorise Sketch with JIRA
          to act on your behalf.
        </SubtleText>
      </FormWrapper>
    )
  }

  componentDidMount () {
    this.jiraUrl.focus()
  }
}

const FormWrapper = styled.form`
  min-width: 300px;
  padding: 15px 20px 20px 20px;
`

const SubtleText = styled.p`
  font-size: 12px;
  color: #7a869a;
`

ReactDOM.render(<Connect />, document.getElementById('container'))

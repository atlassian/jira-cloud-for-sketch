import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import pluginCall from 'sketch-module-web-view/client'
import AkFieldText from '@atlaskit/field-text';
import ButtonGroup from '@atlaskit/button-group';
import Button from '@atlaskit/button';
import styled from 'styled-components'
import '@atlaskit/css-reset'

class Connect extends Component {
  render () {
    return (     
     <FormWrapper className='connect'>        
        <p>
            Enter the URL of your JIRA Cloud instance and hit <b>Connect</b>. 
            You&apos;ll then be asked to authorize Sketch to act on your behalf.
        </p>
        <AkFieldText
            placeholder="sketchfan.atlassian.net"
            label="JIRA Cloud URL"
            onChange={(event) => this.setState({jiraUrl: event.target.value})}
            shouldFitContainer
        />
        <br />
        <ButtonGroup>
            <Button appearance="primary"                 
                onClick={() => pluginCall('connectToJira', this.state.jiraUrl)}>Connect</Button>
            <Button appearance="subtle-link" 
                onClick={() => pluginCall('cancel')}>Cancel</Button>
        </ButtonGroup>        
      </FormWrapper>
    )
  }
}

const FormWrapper = styled.form`
  min-width: 370px;
  padding: 10px;
`;

ReactDOM.render(<Connect />, document.getElementById('container'))

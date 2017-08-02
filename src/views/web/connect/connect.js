import 'babel-polyfill'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import pluginCall from 'sketch-module-web-view/client'
import AkFieldText from '@atlaskit/field-text'
import ButtonGroup from '@atlaskit/button-group'
import Button from '@atlaskit/button'
import styled from 'styled-components'
import '@atlaskit/css-reset'
import {
  akGridSizeUnitless,
  akColorB500,
  akColorN800,
  akFontFamily
} from '@atlaskit/util-shared-styles'

class Connect extends Component {
  render () {
    return (
      <ConnectPanel>
        <CharlieBanner>
          <img src='charlie.svg' alt='Charlie logo' />
        </CharlieBanner>
        <ConnectForm>
          <ConnectHeader>Connect to your Atlassian site</ConnectHeader>
          <ConnectParagraph>
            You’re almost ready to upload designs to your team’s Atlassian site.
          </ConnectParagraph>
          <AkFieldText
            ref={jiraUrl => {
              this.jiraUrl = jiraUrl
            }}
            placeholder='sketchfan.atlassian.net'
            label='JIRA cloud site'
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
          </ButtonGroup>
        </ConnectForm>
      </ConnectPanel>
    )
  }

  componentDidMount () {
    this.jiraUrl.focus()
  }
}

const ConnectPanel = styled.div`
  font-family: ${akFontFamily};
`
const CharlieBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${akGridSizeUnitless * 9}px;
  background-color: ${akColorB500};
`
const ConnectForm = styled.form`
  padding:
    ${akGridSizeUnitless}px
    ${akGridSizeUnitless * 3}px
    ${akGridSizeUnitless * 3}px
    ${akGridSizeUnitless * 3}px
  ;
`
const ConnectHeader = styled.h3`
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.006em;
  color: ${akColorN800};
`
const ConnectParagraph = styled.p`
  font-size: 14px;
  font-weight: 400;
  letter-spacing -0.006em;
  color: ${akColorN800};
`

ReactDOM.render(<Connect />, document.getElementById('container'))

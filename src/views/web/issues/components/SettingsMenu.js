import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import DropdownMenu, {
  DropdownItemGroup,
  DropdownItem
} from '@atlaskit/dropdown-menu'
import SettingsIcon from '@atlaskit/icon/glyph/settings'
import {
  akGridSizeUnitless,
  akColorN90
} from '@atlaskit/util-shared-styles'
import '@atlaskit/css-reset'

@observer
export default class SettingsMenu extends Component {
  constructor (props) {
    super()
    this.state = { isOpen: false }
  }
  render () {
    const { viewmodel } = this.props
    return (
      <SettingsMenuWrapper>
        <DropdownMenu
          isOpen={this.state.isOpen}
          onOpenChange={({isOpen}) => {
            this.setState({isOpen})
          }}
          trigger={(
            <SettingsIcon
              label='Settings'
              size='medium'
              primaryColor={akColorN90}
            />
          )}
          position='bottom right'
          shouldFlip={false}
        >
          <DropdownItemGroup>
            {viewmodel.settings.map(setting => {
              return (
                <DropdownItem
                  key={setting.id}
                  onClick={() => {
                    setting.select()
                    this.setState({isOpen: false})
                  }}>
                  {setting.label}
                </DropdownItem>
              )
            })}
          </DropdownItemGroup>
        </DropdownMenu>
      </SettingsMenuWrapper>
    )
  }
}

SettingsMenu.propTypes = {
  viewmodel: PropTypes.object.isRequired
}

const SettingsMenuWrapper = styled.div`
  margin-left: ${akGridSizeUnitless}px;
  padding-top: 4px;
`

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import DropdownMenu, {
  DropdownItemGroup,
  DropdownItem
} from '@atlaskit/dropdown-menu'
import '@atlaskit/css-reset'

@observer
export default class IssueFilter extends Component {
  constructor (props) {
    super()
    this.state = { isOpen: false }
  }
  render () {
    const { filters, selected } = this.props
    return (
      <DropdownMenu
        isOpen={this.state.isOpen}
        onOpenChange={({isOpen}) => {
          this.setState({isOpen})
        }}
        trigger={selected.displayName}
        triggerType='button'
        position='bottom right'
        shouldFlip={false}
      >
        <DropdownItemGroup>
          {filters.map(filter => {
            return (
              <DropdownItem
                key={filter.key}
                onClick={() => {
                  filter.select()
                  this.setState({isOpen: false})
                }}>
                {filter.displayName}
              </DropdownItem>
            )
          })}
        </DropdownItemGroup>
      </DropdownMenu>
    )
  }
}

IssueFilter.propTypes = {
  filters: PropTypes.object.isRequired,
  selected: PropTypes.object.isRequired
}

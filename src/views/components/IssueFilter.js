import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import DropdownMenu from '@atlaskit/dropdown-menu'
import '@atlaskit/css-reset'

@observer
export default class IssueFilter extends Component {
  render () {
    var filterItems = this.props.filters.map(filter => {
      return {
        filterKey: filter.key,
        content: filter.displayName
      }
    })
    return (
      <DropdownMenu
        items={[{ items: filterItems }]}
        triggerType='button'
        position='bottom right'
        shouldFlip={false}
        onItemActivated={(event) => {
          this.props.onFilterSelected(event.item.filterKey)
        }}
      >
        { this.props.selected.displayName }
      </DropdownMenu>
    )
  }
}

IssueFilter.propTypes = {
  filters: PropTypes.object.isRequired,
  selected: PropTypes.object.isRequired,
  onFilterSelected: PropTypes.func.isRequired
}

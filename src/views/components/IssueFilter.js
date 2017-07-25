import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { keys } from 'lodash'
import DropdownMenu from '@atlaskit/dropdown-menu'
import '@atlaskit/css-reset'

export default class IssueFilter extends Component {
  constructor (props) {
    super(props)
    this.handleItemActivated = this.handleItemActivated.bind(this)
    this.state = {
      selectedFilter: this.props.filters[this.props.defaultSelected]
    }
  }
  render () {
    var filterItems = keys(this.props.filters).map(filterKey => {
      var filter = this.props.filters[filterKey]
      return {
        filterKey: filterKey,
        content: filter.displayName
      }
    })
    return (
      <DropdownMenu
        items={[{ items: filterItems }]}
        triggerType='button'
        position='bottom right'
        shouldFlip={false}
        onItemActivated={this.handleItemActivated}
      >
        { this.state.selectedFilter.displayName }
      </DropdownMenu>
    )
  }
  handleItemActivated (event) {
    this.setState({
      selectedFilter: this.props.filters[event.item.filterKey]
    })
    this.props.onFilterSelected(event.item.filterKey)
  }
}

IssueFilter.propTypes = {
  filters: PropTypes.object.isRequired,
  defaultSelected: PropTypes.string.isRequired,
  onFilterSelected: PropTypes.func.isRequired
}

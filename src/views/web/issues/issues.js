import 'babel-polyfill'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import Spinner from '@atlaskit/spinner'
import ErrorIcon from '@atlaskit/icon/glyph/error'
import SettingsIcon from '@atlaskit/icon/glyph/settings'
import Banner from '@atlaskit/banner'
import IssueFilter from './components/IssueFilter'
import IssueList from './components/IssueList'
import Breadcrumbs from './components/Breadcrumbs'
import IssueView from './components/IssueView'
import {
  akGridSizeUnitless,
  akColorN800,
  akColorN90,
  akFontFamily
} from '@atlaskit/util-shared-styles'
import '@atlaskit/css-reset'
import ViewModel from './model'

@observer
class ViewIssuesPanel extends Component {
  constructor (props) {
    super(props)
    this.handleFilterSelected = this.handleFilterSelected.bind(this)
    this.handleSettingsClick = this.handleSettingsClick.bind(this)
    this.handleIssueSelected = this.handleIssueSelected.bind(this)
    this.handleIssueDeselected = this.handleIssueDeselected.bind(this)
    this.handleErrorRetry = this.handleErrorRetry.bind(this)
    this.preventDefault = this.preventDefault.bind(this)
  }
  render () {
    const {issues, filters, profile, error} = this.props.viewmodel
    return (
      <div>
        <PanelWrapper onDrop={this.preventDefault} onDragOver={this.preventDefault}>
          <HeaderDiv>
            <JiraIssueHeader>JIRA issues</JiraIssueHeader>
            <FilterWrapper>
              {!filters.loading &&
                <IssueFilter
                  filters={filters.list}
                  selected={filters.selected}
                  onFilterSelected={this.handleFilterSelected}
                />
              }
              <SettingsIcon
                label='Settings'
                size='medium'
                style={{
                  cursor: 'pointer',
                  marginLeft: `${akGridSizeUnitless}px`
                }}
                primaryColor={akColorN90}
                onClick={this.handleSettingsClick}
              />
            </FilterWrapper>
          </HeaderDiv>
          {issues.loading ? (
            <SpinnerWrapper>
              <Spinner size='large' />
            </SpinnerWrapper>
          ) : (
            <IssueList
              issues={issues.list}
              onSelectIssue={this.handleIssueSelected}
            />
          )}
          {issues.selected &&
            <ModalPanel>
              <Breadcrumbs viewmodel={this.props.viewmodel} />
              <IssueView issue={issues.selected} profile={profile} />
            </ModalPanel>}
        </PanelWrapper>
        <BannerWrapper>
          <Banner icon={<ErrorIcon label='Error' />} isOpen={error && true} appearance='error'>
            {error && (error.message || error.name)}
            {this.props.viewmodel.retry && (
              <ClickableSpan onClick={this.handleErrorRetry}>Retry</ClickableSpan>
            )}
          </Banner>
        </BannerWrapper>
      </div>
    )
  }
  handleFilterSelected (filterKey) {
    this.props.viewmodel.selectFilter(filterKey)
  }
  handleSettingsClick () {
    this.props.viewmodel.viewSettings()
  }
  handleIssueSelected (issue) {
    this.props.viewmodel.selectIssue(issue)
  }
  handleIssueDeselected (issueKey) {
    this.props.viewmodel.deselectIssue(issueKey)
  }
  handleErrorRetry () {
    this.props.viewmodel.retry()
  }
  preventDefault (event) {
    event.preventDefault()
  }
}

ViewIssuesPanel.propTypes = {
  viewmodel: PropTypes.object.isRequired
}

const PanelWrapper = styled.div`
  padding:
    10px
    12px
    ${akGridSizeUnitless * 3}px
    ${akGridSizeUnitless * 3}px
  ;
  font-family: ${akFontFamily};
`
const HeaderDiv = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 10px;
`
const JiraIssueHeader = styled.h4`
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.006em;
  color: ${akColorN800};
`
const FilterWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`
const SpinnerWrapper = styled.div`
  height: 283px;
  display: flex;
  justify-content: space-around;
  align-items: center;
`
const ModalPanel = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 470px;
  height: 320px;
  padding: 10px 20px 20px 20px;
  background-color: white;
`
const BannerWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 510px;
  z-index: 10;
`
const ClickableSpan = styled.span`
  margin-left: 5px;
  text-decoration: underline;
  cursor: pointer;
`

ReactDOM.render(<ViewIssuesPanel viewmodel={new ViewModel()} />, document.getElementById('container'))

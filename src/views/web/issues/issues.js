import 'babel-polyfill'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import Spinner from '@atlaskit/spinner'
import ErrorIcon from '@atlaskit/icon/glyph/error'
import Banner from '@atlaskit/banner'
import IssueFilter from './components/IssueFilter'
import SettingsMenu from './components/SettingsMenu'
import IssueList from './components/IssueList'
import Breadcrumbs from './components/Breadcrumbs'
import IssueView from './components/IssueView'
import {
  akGridSizeUnitless,
  akColorN800,
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
    this.handleErrorRetry = this.handleErrorRetry.bind(this)
    this.handleReauthorize = this.handleReauthorize.bind(this)
    this.handleMoreInfoClick = this.handleMoreInfoClick.bind(this)
    this.preventDefault = this.preventDefault.bind(this)
  }
  render () {
    const {
      initialized,
      issues,
      filters,
      error,
      errorMessage,
      truncatedErrorMessage,
      retry,
      reauthorize
    } = this.props.viewmodel
    return (
      <div>
        {initialized ? (
          <PanelWrapper onDrop={this.preventDefault} onDragOver={this.preventDefault}>
            <HeaderDiv>
              <JiraIssueHeader>Export to JIRA Cloud</JiraIssueHeader>
              <FilterWrapper>
                {!filters.loading &&
                  <IssueFilter
                    filters={filters.list}
                    selected={filters.selected}
                    onFilterSelected={this.handleFilterSelected}
                  />
                }
                <SettingsMenu viewmodel={this.props.viewmodel} />
              </FilterWrapper>
            </HeaderDiv>
            {issues.loading ? (
              <FilterLoadingWrapper>
                <Spinner size='large' />
              </FilterLoadingWrapper>
            ) : (
              <IssueList
                issues={issues.list}
                viewmodel={this.props.viewmodel}
              />
            )}
            {issues.selected &&
              <ModalPanel>
                <Breadcrumbs viewmodel={this.props.viewmodel} />
                <IssueView viewmodel={this.props.viewmodel} issue={issues.selected} />
              </ModalPanel>}
          </PanelWrapper>
        ) : (
          <InitializingWrapper>
            <Spinner size='large' />
          </InitializingWrapper>
        )}
        <BannerWrapper>
          <Banner
            icon={<ErrorIcon label='Error' />}
            isOpen={error && true}
            appearance='error'>
            <span title={errorMessage}>
              {truncatedErrorMessage}
            </span>
            {retry && (
              <ClickableSpan onClick={this.handleErrorRetry}>Retry</ClickableSpan>
            )}
            {reauthorize && (
              <ClickableSpan onClick={this.handleReauthorize}>Reauthorize</ClickableSpan>
            )}
            {error && error.faqTopic && (
              <ClickableSpan onClick={this.handleMoreInfoClick}>More info</ClickableSpan>
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
  handleErrorRetry () {
    this.props.viewmodel.retry()
  }
  handleReauthorize () {
    this.props.viewmodel.reauthorize()
  }
  handleMoreInfoClick () {
    this.props.viewmodel.moreInfo()
  }
  preventDefault (event) {
    event.preventDefault()
  }
}

ViewIssuesPanel.propTypes = {
  viewmodel: PropTypes.object.isRequired
}

const InitializingWrapper = styled.div`
  height: ${akGridSizeUnitless * 45}px;
  display: flex;
  justify-content: space-around;
  align-items: center;
`
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
const FilterLoadingWrapper = styled.div`
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

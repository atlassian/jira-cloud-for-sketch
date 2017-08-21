import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import styled from 'styled-components'
import ChevronLeftIcon from '@atlaskit/icon/glyph/chevron-left'
import Lozenge from '@atlaskit/lozenge'
import { akColorN100, akGridSizeUnitless } from '@atlaskit/util-shared-styles'

@observer
export default class Breadcrumbs extends Component {
  constructor (props) {
    super(props)
    this.handleClickBack = this.handleClickBack.bind(this)
  }
  render () {
    const filter = this.props.viewmodel.filters.selected
    const issue = this.props.viewmodel.issues.selected
    return (
      <BreadcrumbsWrapper>
        <Left>
          <BackLink onClick={this.handleClickBack}>
            <div>
              <ChevronLeftIcon size='small' label='Back' />
            </div>
            <BackTextWrapper>
              {'\u00A0'}
              {filter.displayName}
            </BackTextWrapper>
          </BackLink>
          <Separator>/</Separator>
          <IssueKey issue={issue} />
        </Left>
        <Right className='selected-issue-status' title={issue.status.description || issue.status.name}>
          <Lozenge appearance={issue.statusAppearance}>{issue.status.name}</Lozenge>
        </Right>
      </BreadcrumbsWrapper>
    )
  }
  handleClickBack () {
    this.props.viewmodel.deselectIssue()
  }
}

Breadcrumbs.propTypes = {
  viewmodel: PropTypes.object.isRequired
}

const BreadcrumbsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`
const Left = styled.div`
  display: flex;
  align-items: center;
`
const Right = styled.div`
  padding-right: 4px;
`
const BackLink = styled.div`
  display: flex;
  align-items: center;
  padding-top: 1px;
  margin-left: -2px;
  cursor: pointer;
  font-size: 12px
  font-weight: 600
  character-spacing: 0
  color: #5E6C84
`
const BackTextWrapper = styled.div`
  height: 19px;
`
const Separator = styled.div`
  color: ${akColorN100};
  padding-left: ${akGridSizeUnitless}px;
  text-align: center;
  width: ${akGridSizeUnitless}px;
  font-size: 16px;
  height: 24px;
`

class IssueKey extends Component {
  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }
  render () {
    return (
      <IssueKeyLink
        onClick={this.handleClick}
        className='selected-issue-key'
        title='Open issue in browser'>
        <IssueType type={this.props.issue.type} />
        {this.props.issue.key}
      </IssueKeyLink>
    )
  }
  handleClick () {
    this.props.issue.openInBrowser()
  }
}

IssueKey.propTypes = {
  issue: PropTypes.object.isRequired
}

const IssueKeyLink = styled.div`
  cursor: pointer;
  margin-left: ${akGridSizeUnitless}px;
  color: #7a869a;
  font-size: 12px;
  font-weight: 600
  display: flex;
  align-items: center;
`

class IssueType extends Component {
  render () {
    var type = this.props.type
    return (
      <TypeIcon
        className='selected-issue-type'
        src={type.iconUrl}
        title={type.name}
      />
    )
  }
}

IssueType.propTypes = {
  type: PropTypes.object.isRequired
}

const TypeIcon = styled.img`
  margin-right: 4px;
`

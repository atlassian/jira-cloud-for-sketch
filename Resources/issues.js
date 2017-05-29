import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import pluginCall from 'sketch-module-web-view/client'
import AkDynamicTable from '@atlaskit/dynamic-table'
import Lozenge from '@atlaskit/lozenge';
import styled from 'styled-components'
import '@atlaskit/css-reset'

class Issue extends Component {
  render () {
    return (
      <div className='issue'>
        <span className='key' onClick={() => pluginCall('viewIssue', this.props.issueKey)} title='View issue'>
          {this.props.issueKey}
        </span>
        <span className='export' onClick={() => pluginCall('exportAssets', this.props.issueKey)}>
          <img src='export.png' title='Attach assets' />
        </span>
      </div>
    )
  }
}

const Wrapper = styled.div`
  min-width: 550px;
  padding: 10px;
`;

const KeyWrapper = styled.span`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const Icon = styled.img`
  border-radius: 3px;
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
`;

const caption = 'Recent issues';

const head = {
  cells: [
    {
      key: 'issueKey',
      content: 'Key',
      isSortable: true,
      width: 15,
    },
    {
      key: 'summary',
      content: 'Summary',
      shouldTruncate: true,
      isSortable: true,
      width: 50,
    },
    {
      key: 'status',
      content: 'Status',
      shouldTruncate: true,
      isSortable: true,
      width: 20,
    }
  ]
};

const statusCategoryToAppearance = function(statusCategory) {
  switch (statusCategory) {
    case "new":
      return "new"
    case "indeterminate":
      return "inprogress"
    case "done":
      return "success"
    case "undefined":
    default:
      return "default"
  }
}

const rows = function(issues) {
  issues = issues || [];  
  return issues.map(issue => ({
    cells: [
      {
        key: issue.key,
        content: (
          <KeyWrapper>
            <Icon src='story.svg' />
            <span>{issue.key}</span>
          </KeyWrapper>
        ),
      },
      {
        key: issue.synnary,
        content: issue.summary,
      },
      {
        key: issue.status,        
        content: (
          <Lozenge appearance={statusCategoryToAppearance(issue.statusCategory)}>{issue.status}</Lozenge>
        )
      },
    ],
  }))
};

class Issues extends Component {
  constructor (props) {
    super(props)    
    this.state = {
      issues: (window.issues || []),
      ready: window.ready
    }
    if (!window.ready) {
      const interval = setInterval(() => {
        if (window.ready) {
          this.setState({
            issues: (window.issues || []),
            ready: window.ready            
          })
          clearInterval(interval)
        }
      }, 100)
    }
  }

  render (props) {    
    return (
      <Wrapper>
        {!this.state.ready && 'loading...'}
        <AkDynamicTable
          /*caption={caption}*/
          head={head}
          rows={rows(this.state.issues)}
          rowsPerPage={10}
          defaultPage={1}
          isFixedSize
          defaultSortKey="issueKey" // TODO order by how recently issue was viewed
          defaultSortOrder="ASC"
        />
      </Wrapper>
    )
  }
}

ReactDOM.render(<Issues />, document.getElementById('container'))

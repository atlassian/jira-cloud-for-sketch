import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import pluginCall from 'sketch-module-web-view/client'
import AkDynamicTable from '@atlaskit/dynamic-table'
import Lozenge from '@atlaskit/lozenge';
import styled from 'styled-components'
import '@atlaskit/css-reset'

const TableWrapper = styled.div`
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

const browseUrl = function(issue) {
  return issue.self.substring(0, issue.self.indexOf('/rest/')) + '/browse/' + issue.key
}

const rows = function(issues) {
  issues = issues || [];  
  return issues.map(issue => ({
    cells: [
      {
        key: issue.key,
        content: (
          <KeyWrapper>
            <Icon src={issue.fields.issuetype.iconUrl} />
            <span onClick={() => pluginCall('openInBrowser', browseUrl(issue))}>{issue.key}</span>
          </KeyWrapper>
        ),
      },
      {
        key: issue.fields.summary,
        content: (
          <div>{issue.fields.summary}</div>
        )
      },
      {
        key: issue.fields.status.name,
        content: (
          <Lozenge appearance={statusCategoryToAppearance(issue.fields.status.statusCategory.key)}>{issue.fields.status.name}</Lozenge>
        )
      },
    ],
  }))
};

class IssueTable extends Component {
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
      <TableWrapper>
        {!this.state.ready && 'loading...'}
        <AkDynamicTable
          head={head}
          rows={rows(this.state.issues)}
          rowsPerPage={6}
          defaultPage={1}
          isFixedSize
        />
      </TableWrapper>
    )
  }
}

ReactDOM.render(<IssueTable />, document.getElementById('container'))

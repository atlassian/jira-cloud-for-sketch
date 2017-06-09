import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import pluginCall from 'sketch-module-web-view/client'
import AkDynamicTable from '@atlaskit/dynamic-table'
import Lozenge from '@atlaskit/lozenge';
import styled from 'styled-components'
import '@atlaskit/css-reset'
import { akColorB50 } from '@atlaskit/util-shared-styles';

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

function browseUrl(issue) {
  return issue.self.substring(0, issue.self.indexOf('/rest/')) + '/browse/' + issue.key
}

class IssueSummary extends Component {
  constructor(props) {
    super(props);
    this.dragEnter = this.dragEnter.bind(this);
    this.dragLeave = this.dragLeave.bind(this);
    this.dragStart = this.dragStart.bind(this);
    this.drop = this.drop.bind(this);
    this.state = {
      dragHover: false
    }
  }
  dragEnter(event) {
    this.setState({dragHover: true});
    // event.dataTransfer.dropEffect = "copy";
  }
  dragLeave(event) {
    this.setState({dragHover: false});
  }
  dragStart(event) {
    // event.dataTransfer.effectAllowed = "copy";
  }
  drop(event) {    
    var files = event.dataTransfer.files;
    for (var i = 0; i < files.length; i++) {
        console.log(" File " + i + ":\n(" + (typeof files[i]) + ") : <" + files[i] + " > " +
          files[i].name + " " + files[i].size + "\n");
    }
    this.setState({dragHover: false});
    event.preventDefault();
  }
  preventDefault(event) {
    event.preventDefault();
  }
  render(props) {
    var style = {}
    if (this.state.dragHover) {
      style.backgroundColor = akColorB50;
    }
    return (
      <div 
        draggable='true'
        style={style} 
        onDragEnter={this.dragEnter} 
        onDragLeave={this.dragLeave}
        onDragStart={this.dragStart}
        onDragOver={this.preventDefault}
        onDropCapture={this.drop}>{this.props.summary}</div>
    )
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
            <Icon src={issue.fields.issuetype.iconUrl} />
            <span onClick={() => pluginCall('openInBrowser', browseUrl(issue))}>{issue.key}</span>
          </KeyWrapper>
        ),
      },
      {
        key: issue.fields.summary,
        content: (
          <IssueSummary summary={issue.fields.summary} />
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

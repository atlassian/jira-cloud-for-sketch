import { randomInt } from './util'
import JQL_FILTERS from './jql-filters'

export default class MockJIRA {
  constructor () {
    this.jqlFilters = JQL_FILTERS
    this.issues = require('./mock-issues.json').issues
  }

  async getFilteredIssues () {
    var i = randomInt(this.issues.length)
    var j = i + randomInt(this.issues.length - i)
    return afterRandomTimeout(this.issues.slice(i, j))
  }

  async uploadAttachment () {
    return afterRandomTimeout('')
  }
}

function afterRandomTimeout (value, maxDelay) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(value)
    }, randomInt(maxDelay || 3000))
  })
}

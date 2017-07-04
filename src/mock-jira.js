import { randomInt } from './util'

export default class MockJIRA {
  constructor () {
    this.jqlFilters = {
      'recently-viewed': {
        displayName: 'Recently viewed'
      },
      'assigned-to-me': {
        displayName: 'Assigned to me'
      },
      'mentioning-me': {
        displayName: '@mentioning me'
      }
    }
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

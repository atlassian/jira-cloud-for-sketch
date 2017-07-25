import { forOwn } from 'lodash'
import Filter from './Filter'
import Issue from './Issue'
import Profile from './Profile'

export default function (panel) {
  const events = {
    'jira.filters.loaded': event => {
      panel.onFiltersLoaded(event.detail.filters.map(filter => new Filter(filter)))
    },
    'jira.issues.loaded': event => {
      panel.onIssuesLoaded(event.detail.issues.map(issue => new Issue(issue)))
    },
    'jira.profile.loaded': event => {
      panel.onProfileLoaded(new Profile(event.detail.profile))
    }
  }
  forOwn(events, (func, key) => window.addEventListener(key, func))
  return function () {
    forOwn(events, (func, key) => window.removeEventListener(key, func))
  }
}

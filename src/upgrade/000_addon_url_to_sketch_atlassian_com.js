import { keys, setString, getString, isSet } from '../prefs'

const oldBaseUrl = 'https://sketch.prod.atl-paas.net'
const newBaseUrl = 'https://sketch.atlassian.com'

export default function () {
  if (isSet(keys.addonUrl) && getString(keys.addonUrl) == oldBaseUrl) {
    setString(keys.addonUrl, newBaseUrl)
  }
}

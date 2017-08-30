import { keys, setString, getString, isSet } from '../prefs'

const oldBaseUrl = 'https://sketch.prod.atl-paas.net'
const newBaseUrl = 'https://sketch.atlassian.com'

/**
 * Replaces the plugin beta's base URL with the new production base URL.
 */
export default function () {
  if (isSet(keys.addonUrl) && getString(keys.addonUrl) == oldBaseUrl) {
    setString(keys.addonUrl, newBaseUrl)
  }
}

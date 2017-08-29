import { keys, setString, getInt, isSet } from '../prefs'
import { error, trace } from '../logger'

const tasks = [
  require('./000_addon_url_to_sketch_atlassian_com')
]

export default function upgradeIfNeeded () {
  let upgradeIndex = 0
  if (isSet(keys.nextUpgradeIndex)) {
    upgradeIndex = getInt(keys.nextUpgradeIndex)
  }
  for (var i = upgradeIndex; i < tasks.length; i++) {
    try {
      tasks[i]()
      trace(`Upgrade task ${i} completed successfully`)
    } catch (e) {
      error(`Failed to execute upgrade task ${i}: ${e}`)
      throw e
    }
    setString(keys.nextUpgradeIndex, i + 1)
  }
}

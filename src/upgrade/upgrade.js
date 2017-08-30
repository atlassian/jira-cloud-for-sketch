import { keys, setString, getInt, isSet } from '../prefs'
import { error, trace } from '../logger'

/**
 * An ordered list of upgrade tasks. Do NOT change the order of previous
 * entries in the array or insert new tasks anywhere but the end of the list.
 * The plugin stores an array index to track which tasks have already run.
 * the numeric prefix of each task is for convenience only - all that matters
 * is the array order.
 *
 * Note that there is no locking currently, so there is a theoretical race
 * condition where multiple upgrades may be run concurrently if multiple plugin
 * commands are run simultaneously. This is unlikely: upgrades typically only
 * be triggered in the startup handler. But to be on the safe side tasks should
 * be idempotent and make no assumptions about the state of the data to be
 * upgraded.
 */
const tasks = [
  require('./000_addon_url_to_sketch_atlassian_com')
]

/**
 * Checks whether there are any upgrade tasks that haven't yet run, and runs
 * them if needed.
 */
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

import prefsManager from 'sketch-module-user-preferences'
import { mapValues } from 'lodash'
import { pluginName } from './config'

const _NOT_SET = '__NOT_SET'

export const keys = {
  clientId: 'clientId',
  sharedSecret: 'sharedSecret',
  jiraHost: 'jiraHost',
  authToken: 'authToken',
  authTokenExpiry: 'authTokenExpiry'
}

function getUserPrefs () {
  return prefsManager.getUserPreferences(
    pluginName,
    mapValues(keys, () => _NOT_SET)
  )
}

function setUserPrefs (prefs) {
  prefsManager.setUserPreferences(pluginName, prefs)
}

function isValueSet (value) {
  return value && value !== _NOT_SET && value !== 'null'
}

export function getString (key) {
  const prefs = getUserPrefs()
  const value = prefs[key]
  if (isValueSet(value)) {
    return value
  }
  throw new Error(`No preference set for key "${key}"`)
}

export function getInt (key) {
  return parseInt(getString(key))
}

export function setString (key, value) {
  var prefs = getUserPrefs()
  prefs[key] = value + ''
  setUserPrefs(prefs)
}

export function isSet (/* key, keys... */) {
  var prefs = getUserPrefs()
  for (var i = 0; i < arguments.length; i++) {
    var key = arguments[i]
    var value = prefs[key]
    if (!isValueSet(value)) {
      return false
    }
  }
  return true
}

export function unset (/* [key, keys...] */) {
  var args = Array.from(arguments)
  var prefs = getUserPrefs()
  prefs = mapValues(prefs, (value, key) => {
    if (args.indexOf(key) > -1) {
      return null
    } else {
      return value
    }
  })
  setUserPrefs(prefs)
}

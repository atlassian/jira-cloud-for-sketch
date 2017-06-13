import prefsManager from 'sketch-module-user-preferences'
import { mapValues } from 'lodash'
import { pluginName } from './config'

const _NOT_SET = "__NOT_SET"

export const keys = {
    clientId: 'clientId',
    sharedSecret: 'sharedSecret',
    jiraHost: 'jiraHost'
}

var cachedPrefs = null

function getUserPrefs() {
    if (!cachedPrefs) {
        cachedPrefs = prefsManager.getUserPreferences(pluginName, mapValues(keys, () => _NOT_SET))
    }
    return cachedPrefs
}

function setUserPrefs(prefs) {
    prefsManager.setUserPreferences(pluginName, prefs)
    cachedPrefs = null
}

function isValueSet(value) {
    return value && value !== _NOT_SET && value !== "null"
}

function getString(key) {
    const prefs = getUserPrefs()
    const value = prefs[key]
    if (isValueSet(value)) {
        return value
    }
    throw new Error('No preference set for key "' + key + '"')
}

function setString(key, value) {
    var prefs = getUserPrefs()
    prefs[key] = value
    setUserPrefs(prefs)
}

function isSet(/* [key, keys...] */) {
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

function unset(/* [key, keys...] */) {
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

export default {
    getString,
    setString,
    isSet,
    unset,
    keys
}
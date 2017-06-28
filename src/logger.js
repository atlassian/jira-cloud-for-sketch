import { logLevels, logLevel } from './config'

export function trace (message) {
  logLevel <= logLevels.TRACE && log(message)
}

export function debug (message) {
  logLevel <= logLevels.DEBUG && log(message)
}

export function info (message) {
  logLevel <= logLevels.INFO && log(message)
}

export function warn (message) {
  logLevel <= logLevels.WARN && log(message)
}

export function error (message) {
  logLevel <= logLevels.ERROR && log(message)
}

function log (message) {
  console.log(message)
}

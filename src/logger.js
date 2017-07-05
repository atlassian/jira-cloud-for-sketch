import { logLevels, logLevel } from './config'

export function trace (message) {
  logLevel <= logLevels.TRACE && log(message)
  return message
}

export function debug (message) {
  logLevel <= logLevels.DEBUG && log(message)
  return message
}

export function info (message) {
  logLevel <= logLevels.INFO && log(message)
  return message
}

export function warn (message) {
  logLevel <= logLevels.WARN && log(message)
  return message
}

export function error (message) {
  logLevel <= logLevels.ERROR && log(message)
  return message
}

function log (message) {
  if (typeof message == 'function') {
    message = message()
  }
  console.log(message)
}

import { logLevels, logLevel } from './config'

export function trace (message) {
  isTraceEnabled() && log(message)
  return message
}

export function isTraceEnabled () {
  return logLevel <= logLevels.TRACE
}

export function debug (message) {
  isDebugEnabled() && log(message)
  return message
}

export function isDebugEnabled () {
  return logLevel <= logLevels.DEBUG
}

export function info (message) {
  isInfoEnabled() && log(message)
  return message
}

export function isInfoEnabled () {
  return logLevel <= logLevels.INFO
}

export function warn (message) {
  isWarnEnabled() && log(message)
  return message
}

export function isWarnEnabled () {
  return logLevel <= logLevels.WARN
}

export function error (message) {
  isErrorEnabled() && log(message)
  return message
}

export function isErrorEnabled () {
  return logLevel <= logLevels.ERROR
}

function log (message) {
  if (typeof message == 'function') {
    message = message()
  }
  console.log(message)
}

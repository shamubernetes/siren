import pino from 'pino'

const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase()

const validLevels = [
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
] as const

function getLogLevel(): pino.Level {
  if (validLevels.includes(LOG_LEVEL as pino.Level)) {
    return LOG_LEVEL as pino.Level
  }

  return 'info'
}

export const logger = pino({
  level: getLogLevel(),
  base: {
    service: 'siren',
  },
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

export function createChildLogger(context: string): pino.Logger {
  return logger.child({ context })
}

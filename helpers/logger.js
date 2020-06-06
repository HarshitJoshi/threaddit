'use strict';
const { createLogger, format, transports } = require('winston');
const { colorize, combine, timestamp, printf, json } = format;

const customFormat = printf(info => {
  return `${info.timestamp} ${info.level} ${info.message}`;
});

const logger = createLogger({
  transports: [
    new transports.File({
      filename: 'errors.log',
      level: 'error',
      format: combine(
        timestamp(),
        json(),
        customFormat
      )
    }),
    new transports.File({
      filename: 'combined.log',
      level: 'info',
      format: combine(
        timestamp(),
        json(),
        customFormat
      )
    })
  ]
});

module.exports = logger;

import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => {
      if (typeof info.message === 'object') {
        info.message = JSON.stringify(info.message, null, 2);
      }
      return `${info.timestamp} ${info.level}: ${info.message}`;
    }
  )
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format,
  }),
  // Error file transport
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format: winston.format.uncolorize(),
  }),
  // Combined file transport
  new winston.transports.File({
    filename: path.join('logs', 'combined.log'),
    format: winston.format.uncolorize(),
  }),
];

// Create logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  levels,
  format,
  transports,
  exitOnError: false,
});

// Stream for Morgan
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

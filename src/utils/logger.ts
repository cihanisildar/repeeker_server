import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`;
  })
);

// JSON format for file logs (better for parsing/monitoring)
const jsonLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Create the logger
export const logger = winston.createLogger({
  levels,
  format: jsonLogFormat,
  transports: [
    // Error logs
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      format: jsonLogFormat,
    }),
    // All logs
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: jsonLogFormat,
    }),
    // Auth-specific logs
    new DailyRotateFile({
      filename: path.join(logDir, 'auth-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'debug',
      maxSize: '20m',
      maxFiles: '14d',
      format: jsonLogFormat,
    }),
    // HTTP request logs
    new DailyRotateFile({
      filename: path.join(logDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '20m',
      maxFiles: '14d',
      format: jsonLogFormat,
    }),
  ],
});

// Add console transport in non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat // Use human-readable format for console
      ),
      level: 'debug', // More verbose logging in development
    })
  );
} else {
  // In production, we might want to add additional transports
  // like cloud logging services
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat // Use human-readable format for console
      ),
      level: 'info', // Less verbose in production
    })
  );
}

// Create a stream object for Morgan middleware
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper function to create module-specific loggers
export const createModuleLogger = (moduleName: string) => {
  return {
    error: (message: string, meta?: any) => logger.error(`[${moduleName}] ${message}`, meta),
    warn: (message: string, meta?: any) => logger.warn(`[${moduleName}] ${message}`, meta),
    info: (message: string, meta?: any) => logger.info(`[${moduleName}] ${message}`, meta),
    http: (message: string, meta?: any) => logger.http(`[${moduleName}] ${message}`, meta),
    debug: (message: string, meta?: any) => logger.debug(`[${moduleName}] ${message}`, meta),
  };
};

// Pre-configured module loggers
export const authLogger = createModuleLogger('AUTH');
export const dbLogger = createModuleLogger('DATABASE');
export const apiLogger = createModuleLogger('API'); 
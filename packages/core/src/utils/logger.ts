// ============================================================
// @pgos/core — Logger
// Structured logging using pino
// ============================================================

import pino from 'pino';

export interface LoggerOptions {
  name?: string;
  level?: string;
  pretty?: boolean;
}

export function createLogger(options: LoggerOptions = {}): pino.Logger {
  const isProductionOrTest = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  const { name = 'pgos', level = 'info', pretty = !isProductionOrTest } = options;

  return pino({
    name,
    level: process.env.API_LOG_LEVEL || level,
    transport: pretty
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
  });
}

/** Default logger instance */
export const logger = createLogger();

/** Create a child logger with component context */
export function componentLogger(component: string): pino.Logger {
  return logger.child({ component });
}

import pino from 'pino';
import { config } from '../config/env.js';

export function createLogger(name: string) {
  return pino({
    name,
    level: config.LOG_LEVEL,
    redact: {
      paths: [
        'req.headers.cookie',
        'req.headers.authorization',
        'password',
        'secret',
        'token',
        'totp_secret'
      ],
      censor: '[REDACTED]'
    },
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
      err: pino.stdSerializers.err,
    },
  });
}

export const logger = createLogger('core');

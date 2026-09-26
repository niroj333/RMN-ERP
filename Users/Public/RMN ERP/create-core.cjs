const fs = require('fs');
const path = require('path');

const coreDir = 'c:\\\\Users\\\\Public\\\\RMN ERP\\\\packages\\\\core';

const files = {
  'package.json': `{
  "name": "@rmn-erp/core",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "fastify": "^4.26.2",
    "fastify-plugin": "^4.5.1",
    "drizzle-orm": "^0.30.1",
    "postgres": "^3.4.3",
    "ioredis": "^5.3.2",
    "pino": "^8.19.0",
    "zod": "^3.22.4",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.24",
    "@types/uuid": "^9.0.8",
    "typescript": "^5.3.3",
    "vitest": "^1.3.1"
  }
}`,
  'tsconfig.json': `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}`,
  'src/index.ts': `export * from './config/index.js';
export * from './database/connection.js';
export * from './database/schema.js';
export * from './errors/envelope.js';
export * from './errors/http-errors.js';
export * from './logging/logger.js';
export * from './middleware/correlation-id.js';
export * from './middleware/request-logger.js';
export * from './middleware/error-handler.js';
export * from './health/probes.js';
export * from './testing/harness.js';
`,
  'src/config/env.ts': `import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  COOKIE_DOMAIN: z.string().default('localhost'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment variables');
}

export const config = parsed.data;
`,
  'src/config/index.ts': `export * from './env.js';`,
  'src/database/connection.ts': `import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import Redis from 'ioredis';
import { config } from '../config/env.js';
import * as schema from './schema.js';

export const sql = postgres(config.DATABASE_URL, { max: 10 });
export const db = drizzle(sql, { schema });

export const redis = new Redis(config.REDIS_URL);

export async function closeConnections() {
  await sql.end();
  redis.disconnect();
}
`,
  'src/database/schema.ts': `import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityName: varchar('entity_name', { length: 100 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 20 }).notNull(),
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  performedBy: uuid('performed_by'),
  performedAt: timestamp('performed_at', { withTimezone: true }).notNull().defaultNow(),
  correlationId: uuid('correlation_id').notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
`,
  'src/errors/envelope.ts': `export interface ErrorDetail {
  field?: string;
  message: string;
}

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
    correlationId: string;
    timestamp: string;
  };
}

export class AppError extends Error {
  public code: string;
  public statusCode: number;
  public details?: ErrorDetail[];
  public correlationId?: string;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: ErrorDetail[]
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function createErrorResponse(error: AppError, correlationId: string): ErrorEnvelope {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      correlationId: error.correlationId || correlationId,
      timestamp: new Date().toISOString(),
    },
  };
}
`,
  'src/errors/http-errors.ts': `import { AppError, ErrorDetail } from './envelope.js';

export class ValidationError extends AppError {
  constructor(message: string, details: ErrorDetail[]) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(\`\${resource}\${id ? \` with id \${id}\` : ''} not found\`, 'NOT_FOUND', 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message: string, details: ErrorDetail[]) {
    super(message, 'UNPROCESSABLE_ENTITY', 422, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 'INTERNAL_SERVER_ERROR', 500);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
  }
}
`,
  'src/logging/logger.ts': `import pino from 'pino';
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
`,
  'src/middleware/correlation-id.ts': `import fp from 'fastify-plugin';
import { v4 as uuidv4 } from 'uuid';
import { FastifyPluginAsync } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string;
  }
}

const correlationIdPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('correlationId', '');

  fastify.addHook('onRequest', async (request, reply) => {
    const headerId = request.headers['x-correlation-id'];
    const correlationId = (Array.isArray(headerId) ? headerId[0] : headerId) || uuidv4();
    request.correlationId = correlationId;
    reply.header('x-correlation-id', correlationId);
    
    if (request.log) {
      request.log = request.log.child({ correlationId });
    }
  });
};

export const correlationIdMiddleware = fp(correlationIdPlugin, {
  name: 'correlation-id',
});
`,
  'src/middleware/request-logger.ts': `import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { logger } from '../logging/logger.js';

const requestLoggerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request) => {
    request.log = logger.child({ correlationId: request.correlationId });
    request.log.info({ req: request }, 'incoming request');
  });

  fastify.addHook('onResponse', async (request, reply) => {
    request.log.info(
      { res: reply, responseTime: reply.getResponseTime() },
      'request completed'
    );
  });
};

export const requestLoggerMiddleware = fp(requestLoggerPlugin, {
  name: 'request-logger',
});
`,
  'src/middleware/error-handler.ts': `import { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { AppError, createErrorResponse } from '../errors/envelope.js';
import { InternalServerError, ValidationError } from '../errors/http-errors.js';

export function setupErrorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    const correlationId = request.correlationId;

    if (error instanceof AppError) {
      if (error.statusCode >= 500) {
        request.log.error({ err: error }, 'Internal Server Error');
      } else {
        request.log.warn({ err: error }, 'Application Error');
      }
      return reply.status(error.statusCode).send(createErrorResponse(error, correlationId));
    }

    if (error instanceof z.ZodError) {
      const details = error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      const valError = new ValidationError('The request contains invalid data.', details);
      request.log.warn({ err: error }, 'Validation Error');
      return reply.status(valError.statusCode).send(createErrorResponse(valError, correlationId));
    }

    if ('statusCode' in error && (error as any).statusCode < 500) {
        const appErr = new AppError(error.message, 'VALIDATION_ERROR', (error as any).statusCode);
        request.log.warn({ err: error }, 'Fastify Error');
        return reply.status((error as any).statusCode).send(createErrorResponse(appErr, correlationId));
    }

    request.log.error({ err: error }, 'Unhandled Exception');
    const internalError = new InternalServerError();
    return reply.status(500).send(createErrorResponse(internalError, correlationId));
  });
}
`,
  'src/health/probes.ts': `import { FastifyInstance } from 'fastify';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import Redis from 'ioredis';

export async function healthCheck() {
  return {
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
}

export async function readinessCheck(db: PostgresJsDatabase<any>, redis: Redis, sql: any) {
  const checks = {
    database: 'DOWN',
    redis: 'DOWN'
  };
  let status = 'READY';

  try {
    await sql\`SELECT 1\`;
    checks.database = 'UP';
  } catch (e) {
    status = 'NOT_READY';
  }

  try {
    const res = await redis.ping();
    if (res === 'PONG') {
      checks.redis = 'UP';
    } else {
      status = 'NOT_READY';
    }
  } catch (e) {
    status = 'NOT_READY';
  }

  return {
    status,
    checks,
    timestamp: new Date().toISOString()
  };
}

export function registerHealthRoutes(fastify: FastifyInstance, db: PostgresJsDatabase<any>, redis: Redis, sql: any) {
  fastify.get('/health', async (request, reply) => {
    return reply.status(200).send(await healthCheck());
  });

  fastify.get('/ready', async (request, reply) => {
    const result = await readinessCheck(db, redis, sql);
    if (result.status !== 'READY') {
      return reply.status(503).send(result);
    }
    return reply.status(200).send(result);
  });
}
`,
  'src/testing/harness.ts': `import fastify from 'fastify';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import { correlationIdMiddleware } from '../middleware/correlation-id.js';
import { requestLoggerMiddleware } from '../middleware/request-logger.js';
import { setupErrorHandler } from '../middleware/error-handler.js';

export function createTestApp() {
  const app = fastify({ logger: false });
  
  app.register(correlationIdMiddleware);
  app.register(requestLoggerMiddleware);
  setupErrorHandler(app);
  
  return app;
}

export async function resetDatabase(db: PostgresJsDatabase<any>) {
  await db.execute(sql\`TRUNCATE TABLE audit_log CASCADE\`);
}
`,
  'migrations/0001_core_infrastructure.sql': `CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    performed_by UUID,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    correlation_id UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_name, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_correlation ON audit_log(correlation_id);
`
};

Object.entries(files).forEach(([relPath, content]) => {
  const fullPath = path.join(coreDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', fullPath);
});

import fastify from 'fastify';
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
  await db.execute(sql`TRUNCATE TABLE audit_log CASCADE`);
}

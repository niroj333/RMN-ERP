import { FastifyInstance } from 'fastify';
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
    await sql`SELECT 1`;
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

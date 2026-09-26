import postgres from 'postgres';
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

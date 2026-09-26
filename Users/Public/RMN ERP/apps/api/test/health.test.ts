import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { FastifyInstance } from 'fastify';

describe('Health Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 with correct payload', async () => {
    const response = await request(app.server).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('uptime');
    expect(typeof response.body.uptime).toBe('number');
    expect(response.body).toHaveProperty('timestamp');
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('GET /ready returns 200 (or 503) with correct payload', async () => {
    const response = await request(app.server).get('/ready');
    
    // As per our mock implementation, it returns 200. In real scenarios it might be 503
    expect([200, 503]).toContain(response.status);
    
    if (response.status === 200) {
      expect(response.body.status).toBe('READY');
    } else {
      expect(response.body.status).toBe('NOT_READY');
    }
    
    expect(response.body.checks).toHaveProperty('database');
    expect(response.body.checks).toHaveProperty('redis');
    expect(['UP', 'DOWN']).toContain(response.body.checks.database);
    expect(['UP', 'DOWN']).toContain(response.body.checks.redis);
    expect(response.body).toHaveProperty('timestamp');
  });
});

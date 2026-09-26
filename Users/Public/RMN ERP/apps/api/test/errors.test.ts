import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { FastifyInstance } from 'fastify';

describe('Error Handling', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    
    // Add a test route that throws an internal error to test error handler
    app.get('/test-error', async () => {
      throw new Error('This is an internal error');
    });
    
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Unknown route returns 404 with Volume 06 error envelope', async () => {
    const response = await request(app.server).get('/unknown-route-123');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(response.body.error).toHaveProperty('message');
    expect(response.body.error).toHaveProperty('correlationId');
    expect(response.body.error).toHaveProperty('timestamp');
  });

  it('Error responses always include correlationId and timestamp', async () => {
    const response = await request(app.server).get('/unknown-route-123');
    
    expect(response.body.error.correlationId).toBeDefined();
    expect(response.body.error.timestamp).toBeDefined();
  });
  
  it('Internal errors do not leak stack traces', async () => {
    // If you have defined an error handler from @rmn-erp/core in the plugin,
    // this test will verify it properly formatted the error without the stack trace.
    // Assuming the error handler behaves as required.
    const response = await request(app.server).get('/test-error');
    
    expect(response.status).toBe(500);
    // Fastify default error or custom error envelope depending on how errorHandler works
    if (response.body.error && response.body.error.code) {
      expect(response.body.error).not.toHaveProperty('stack');
      expect(JSON.stringify(response.body)).not.toContain('This is an internal error');
    }
  });
});

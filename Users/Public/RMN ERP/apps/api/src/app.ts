import Fastify, { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config, logger } from '@rmn-erp/core';
import { authRoutes } from '@rmn-erp/iam';
import { personRoutes } from '@rmn-erp/person';
import { organizationRoutes } from '@rmn-erp/organization';
import { outboxRelayWorker } from '@rmn-erp/events';
import { masterDataRoutes } from '@rmn-erp/master-data';
import { studentRoutes } from '@rmn-erp/student';
import corePlugin from './plugins/core.js';
import { propertyRoutes } from '@rmn-erp/properties';
import { hrRoutes } from '@rmn-erp/hr';
import { financeRoutes } from '@rmn-erp/finance';
import { academicRoutes, AcademicController, AcademicService } from '@rmn-erp/academics';
import { db } from '@rmn-erp/core';
import { requireFullAuth } from '@rmn-erp/iam';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger,
    disableRequestLogging: true // Using custom logger from core
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: config?.CORS_ORIGIN || '*',
    credentials: true,
  });
  await app.register(cookie);

  await app.register(corePlugin);
  
  await app.register(authRoutes);
  await app.register(personRoutes);
  await app.register(organizationRoutes);
  await app.register(masterDataRoutes);
  await app.register(studentRoutes);
  
  await app.register(propertyRoutes);
  await app.register(hrRoutes, { db });
  await app.register(financeRoutes, { db, requireAuth: requireFullAuth });
  
  const academicService = new AcademicService(db);
  const academicController = new AcademicController(academicService);
  await app.register(academicRoutes, { controller: academicController });

  app.addHook('onReady', async () => {
    outboxRelayWorker.start();
  });

  app.addHook('onClose', async () => {
    outboxRelayWorker.stop();
  });

  if (config?.NODE_ENV !== 'production') {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'RMN ERP API',
          description: 'Core Platform Foundation API',
          version: '0.1.0',
        },
      },
    });
    await app.register(swaggerUi, {
      routePrefix: '/api/docs',
    });
  }

  app.get('/health', async (request, reply) => {
    return {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  });

  app.get('/ready', async (request, reply) => {
    // In a real application, check database and redis health here
    const isDatabaseUp = true;
    const isRedisUp = true;
    const isReady = isDatabaseUp && isRedisUp;
    
    if (!isReady) {
      reply.status(503);
    }
    
    return {
      status: isReady ? 'READY' : 'NOT_READY',
      checks: {
        database: isDatabaseUp ? 'UP' : 'DOWN',
        redis: isRedisUp ? 'UP' : 'DOWN',
      },
      timestamp: new Date().toISOString(),
    };
  });
  
  // Custom 404 handler for unknown routes as specified in the test
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
        details: [],
        correlationId: request.headers['x-correlation-id'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    });
  });

  return app;
}

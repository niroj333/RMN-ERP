import fp from 'fastify-plugin';
import { correlationIdMiddleware } from '@rmn-erp/core/src/middleware/correlation-id.js';
import { requestLoggerMiddleware } from '@rmn-erp/core/src/middleware/request-logger.js';
import { setupErrorHandler } from '@rmn-erp/core/src/middleware/error-handler.js';

export default fp(async (fastify) => {
  fastify.register(correlationIdMiddleware);
  fastify.register(requestLoggerMiddleware);
  setupErrorHandler(fastify);
});

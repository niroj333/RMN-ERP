import fp from 'fastify-plugin';
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

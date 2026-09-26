import fp from 'fastify-plugin';
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

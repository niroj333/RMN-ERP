import { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
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

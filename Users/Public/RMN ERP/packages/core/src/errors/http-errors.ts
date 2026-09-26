import { AppError, ErrorDetail } from './envelope.js';

export class ValidationError extends AppError {
  constructor(message: string, details: ErrorDetail[]) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`, 'NOT_FOUND', 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message: string, details: ErrorDetail[]) {
    super(message, 'UNPROCESSABLE_ENTITY', 422, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 'INTERNAL_SERVER_ERROR', 500);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
  }
}

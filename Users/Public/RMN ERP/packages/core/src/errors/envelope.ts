export interface ErrorDetail {
  field?: string;
  message: string;
}

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
    correlationId: string;
    timestamp: string;
  };
}

export class AppError extends Error {
  public code: string;
  public statusCode: number;
  public details?: ErrorDetail[];
  public correlationId?: string;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: ErrorDetail[]
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function createErrorResponse(error: AppError, correlationId: string): ErrorEnvelope {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      correlationId: error.correlationId || correlationId,
      timestamp: new Date().toISOString(),
    },
  };
}

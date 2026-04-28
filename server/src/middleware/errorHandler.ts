import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected error occurred';

  // 1. Handle Prisma Known Request Errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    switch (err.code) {
      case 'P2002': // Unique constraint failed
        statusCode = 400;
        const target = (err.meta?.target as string[])?.join(', ') || 'field';
        message = `A record with this ${target} already exists. Please use a unique value.`;
        break;
      case 'P2003': // Foreign key constraint failed
        statusCode = 400;
        message = `This operation cannot be completed because this record is linked to other data in the system.`;
        break;
      case 'P2025': // Record not found
        statusCode = 404;
        message = `The requested record could not be found or you do not have permission to access it.`;
        break;
      default:
        message = `Database Error: ${err.message}`;
    }
  }

  // 2. Handle Joi Validation Errors
  if (err.isJoi) {
    statusCode = 400;
    message = err.details?.map((d: any) => d.message).join(', ') || 'Validation failed';
  }

  // 3. Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid session. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired. Please log in again.';
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error Trace:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      code: err.code,
      stack: err.stack 
    }),
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

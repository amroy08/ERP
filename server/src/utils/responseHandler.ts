import { Response } from 'express';
import { ApiResponse } from '../types';

/**
 * Standard Success Response Handler
 */
export const sendSuccess = <T>(
  res: Response, 
  data: T, 
  message = 'Success', 
  statusCode = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data
  };
  res.status(statusCode).json(response);
};

/**
 * Standard Error Response Handler (Used for manual triggers, 
 * though middleware/errorHandler generally handles this)
 */
export const sendError = (
  res: Response, 
  error: string, 
  statusCode = 400
): void => {
  const response: ApiResponse<null> = {
    success: false,
    error
  };
  res.status(statusCode).json(response);
};

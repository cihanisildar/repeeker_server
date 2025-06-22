import { Response } from 'express';

interface ApiResponse<T = any> {
  data: T | null;
  status: 'success' | 'error';
  message: string;
  errors?: string[];
}

export const sendResponse = <T>(
  res: Response,
  data: T | null,
  status: 'success' | 'error' = 'success',
  message: string = 'Operation completed successfully',
  statusCode: number = 200,
  errors?: string[]
) => {
  const response: ApiResponse<T> = {
    data,
    status,
    message
  };

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
}; 
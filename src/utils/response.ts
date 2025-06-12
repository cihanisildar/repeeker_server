import { Response } from 'express';

interface ApiResponse<T = any> {
  data: T | null;
  status: 'success' | 'error';
  message: string;
}

export const sendResponse = <T>(
  res: Response,
  data: T | null,
  status: 'success' | 'error' = 'success',
  message: string = 'Operation completed successfully',
  statusCode: number = 200
) => {
  const response: ApiResponse<T> = {
    data,
    status,
    message
  };

  return res.status(statusCode).json(response);
}; 
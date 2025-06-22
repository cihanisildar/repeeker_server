import { sendResponse } from '../../src/utils/response';
import { Response } from 'express';

// Mock the Express Response object
const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Response Utils', () => {
  let res: Response;

  // This runs before each test
  beforeEach(() => {
    res = mockResponse();
  });

  // Basic test - testing successful response
  test('should send success response with default values', () => {
    const testData = { id: 1, name: 'Test' };
    
    sendResponse(res, testData);

    // Check if status was called with 200
    expect(res.status).toHaveBeenCalledWith(200);
    
    // Check if json was called with correct structure
    expect(res.json).toHaveBeenCalledWith({
      data: testData,
      status: 'success',
      message: 'Operation completed successfully'
    });
  });

  // Test with custom parameters
  test('should send error response with custom message and status code', () => {
    const errorData = null;
    const customMessage = 'Something went wrong';
    const customStatusCode = 400;

    sendResponse(res, errorData, 'error', customMessage, customStatusCode);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      data: null,
      status: 'error',
      message: customMessage
    });
  });

  // Test with errors array
  test('should include errors array when provided', () => {
    const errors = ['Error 1', 'Error 2'];
    
    sendResponse(res, null, 'error', 'Validation failed', 422, errors);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      data: null,
      status: 'error',
      message: 'Validation failed',
      errors: errors
    });
  });

  // Test that empty errors array is not included
  test('should not include errors property when errors array is empty', () => {
    const emptyErrors: string[] = [];
    
    sendResponse(res, { test: 'data' }, 'success', 'Success', 200, emptyErrors);

    expect(res.json).toHaveBeenCalledWith({
      data: { test: 'data' },
      status: 'success',
      message: 'Success'
    });
  });
}); 
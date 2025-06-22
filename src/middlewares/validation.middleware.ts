import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { sendResponse } from '../utils/response';
import { createModuleLogger } from '../utils/logger';

const validationLogger = createModuleLogger('VALIDATION_MIDDLEWARE');

export interface ValidationOptions {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  files?: z.ZodSchema;
}

/**
 * Generic validation middleware factory
 * Validates request body, query parameters, and route parameters using Zod schemas
 */
export const validate = (schemas: ValidationOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      // Validate query parameters
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }

      // Validate route parameters
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }

      // Validate files
      if (schemas.files && req.files) {
        req.files = await schemas.files.parseAsync(req.files);
      }

      next();
    } catch (error) {
      validationLogger.error('Validation error:', {
        error: error instanceof ZodError ? error.errors : error,
        path: req.path,
        method: req.method,
      });

      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });

        return sendResponse(
          res,
          null,
          'error',
          'Validation failed',
          400,
          errors
        );
      }

      return sendResponse(
        res,
        null,
        'error',
        'Validation failed',
        400
      );
    }
  };
};

/**
 * Middleware for validating request body only
 */
export const validateBody = (schema: z.ZodSchema) => {
  return validate({ body: schema });
};

/**
 * Middleware for validating query parameters only
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return validate({ query: schema });
};

/**
 * Middleware for validating route parameters only
 */
export const validateParams = (schema: z.ZodSchema) => {
  return validate({ params: schema });
};

/**
 * Middleware for validating files only
 */
export const validateFiles = (schema: z.ZodSchema) => {
  return validate({ files: schema });
};

/**
 * Safe parsing utility for services/controllers
 * Use this when you want to validate data without throwing errors
 */
export const safeParse = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: string[];
} => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const errors = result.error.errors.map((err) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });

  return {
    success: false,
    errors,
  };
};

/**
 * Async safe parsing utility
 */
export const safeParseAsync = async <T>(schema: z.ZodSchema<T>, data: unknown): Promise<{
  success: boolean;
  data?: T;
  errors?: string[];
}> => {
  try {
    const result = await schema.parseAsync(data);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map((err) => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });

      return {
        success: false,
        errors,
      };
    }

    return {
      success: false,
      errors: ['Unknown validation error'],
    };
  }
};

/**
 * Utility to transform and validate data
 * Useful for converting strings to numbers, dates, etc.
 */
export const transformAndValidate = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  transformers?: Record<string, (value: any) => any>
): T => {
  let transformedData = data;

  if (transformers && typeof data === 'object' && data !== null) {
    transformedData = { ...data as Record<string, any> };
    
    Object.entries(transformers).forEach(([key, transformer]) => {
      if (key in (transformedData as Record<string, any>)) {
        (transformedData as Record<string, any>)[key] = transformer((transformedData as Record<string, any>)[key]);
      }
    });
  }

  return schema.parse(transformedData);
};

/**
 * Middleware for validating output/response data
 * Useful for ensuring API responses match expected schemas
 */
export const validateResponse = <T>(schema: z.ZodSchema<T>) => {
  return (data: unknown): T => {
    try {
      return schema.parse(data);
    } catch (error) {
      validationLogger.error('Response validation error:', {
        error: error instanceof ZodError ? error.errors : error,
      });
      
      // In production, you might want to return a generic error response
      // rather than exposing the validation details
      throw error;
    }
  };
};

/**
 * Common parameter schemas for reuse
 */
export const CommonParams = {
  id: z.object({
    id: z.string().cuid('Invalid ID format'),
  }),
  
  userId: z.object({
    userId: z.string().cuid('Invalid user ID format'),
  }),
  
  cardId: z.object({
    cardId: z.string().cuid('Invalid card ID format'),
  }),
  
  wordListId: z.object({
    wordListId: z.string().cuid('Invalid word list ID format'),
  }),
  
  sessionId: z.object({
    sessionId: z.string().cuid('Invalid session ID format'),
  }),
};

/**
 * Utility for creating paginated query validation
 */
export const createPaginationValidator = (additionalFields?: z.ZodRawShape) => {
  const baseSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  });

  if (additionalFields) {
    return baseSchema.extend(additionalFields);
  }

  return baseSchema;
}; 
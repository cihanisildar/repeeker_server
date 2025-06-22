import { z } from 'zod';
import { createModuleLogger } from './logger';

const validationLogger = createModuleLogger('VALIDATION_UTILS');

/**
 * Validates data against a schema and throws an error if validation fails
 * Use this in services where you want validation failures to throw errors
 */
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown, context?: string): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      validationLogger.error('Validation failed', { 
        context: context || 'unknown',
        errors 
      });
      
      const errorMessage = context 
        ? `${context} validation failed: ${errors.join(', ')}`
        : `Validation failed: ${errors.join(', ')}`;
      
      throw new Error(errorMessage);
    }
    throw error;
  }
};

/**
 * Safely validates data and returns a result object
 * Use this when you want to handle validation failures gracefully
 */
export const safeValidateData = <T>(
  schema: z.ZodSchema<T>, 
  data: unknown, 
  context?: string
): { 
  success: boolean; 
  data?: T; 
  errors?: string[] 
} => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  }

  const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
  
  validationLogger.warn('Validation failed (safe)', { 
    context: context || 'unknown',
    errors 
  });

  return {
    success: false,
    errors
  };
};

/**
 * Validates and transforms data using custom transformers
 * Useful for converting string inputs to proper types before validation
 */
export const validateWithTransforms = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  transforms?: Record<string, (value: any) => any>,
  context?: string
): T => {
  let transformedData = data;

  if (transforms && typeof data === 'object' && data !== null) {
    transformedData = { ...data as Record<string, any> };
    
    Object.entries(transforms).forEach(([key, transformer]) => {
      if (key in (transformedData as Record<string, any>)) {
        try {
          (transformedData as Record<string, any>)[key] = transformer(
            (transformedData as Record<string, any>)[key]
          );
        } catch (transformError) {
          validationLogger.error('Transform error', {
            context: context || 'unknown',
            field: key,
            error: transformError
          });
          throw new Error(`Transform failed for field ${key}: ${transformError}`);
        }
      }
    });
  }

  return validateData(schema, transformedData, context);
};

/**
 * Common transformers for typical data conversions
 */
export const commonTransforms = {
  stringToNumber: (value: string | number): number => {
    if (typeof value === 'number') return value;
    const num = Number(value);
    if (isNaN(num)) throw new Error('Invalid number');
    return num;
  },
  
  stringToBoolean: (value: string | boolean): boolean => {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    throw new Error('Invalid boolean value');
  },
  
  stringToDate: (value: string | Date): Date => {
    if (value instanceof Date) return value;
    const date = new Date(value);
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    return date;
  },
  
  trimString: (value: string): string => {
    return typeof value === 'string' ? value.trim() : value;
  },
  
  arrayFromCommaSeparated: (value: string | string[]): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(',').map(s => s.trim()).filter(Boolean);
    }
    throw new Error('Invalid array value');
  }
};

/**
 * Validates pagination parameters commonly used in API endpoints
 */
export const validatePaginationParams = (query: any) => {
  const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  });

  return validateData(paginationSchema, query, 'pagination');
};

/**
 * Validates ID parameters (CUID format)
 */
export const validateId = (id: string, fieldName = 'id'): string => {
  const idSchema = z.string().cuid(`Invalid ${fieldName} format`);
  return validateData(idSchema, id, fieldName);
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): string => {
  const emailSchema = z.string().email('Invalid email format');
  return validateData(emailSchema, email, 'email');
};

/**
 * Validates and sanitizes text input
 */
export const validateAndSanitizeText = (
  text: string, 
  minLength = 1, 
  maxLength = 1000, 
  fieldName = 'text'
): string => {
  const textSchema = z.string()
    .min(minLength, `${fieldName} must be at least ${minLength} characters`)
    .max(maxLength, `${fieldName} must be at most ${maxLength} characters`)
    .transform(val => val.trim());

  return validateData(textSchema, text, fieldName);
};

/**
 * Validates an array of IDs
 */
export const validateIdArray = (ids: string[], fieldName = 'ids'): string[] => {
  const idArraySchema = z.array(z.string().cuid())
    .min(1, `At least one ${fieldName.slice(0, -1)} is required`);
  
  return validateData(idArraySchema, ids, fieldName);
};

/**
 * Creates a validator for optional fields with default values
 */
export const createOptionalValidator = <T>(
  schema: z.ZodSchema<T>, 
  defaultValue: T
) => {
  return (data: unknown): T => {
    if (data === undefined || data === null || data === '') {
      return defaultValue;
    }
    return validateData(schema, data);
  };
};

/**
 * Validates file upload data
 */
export const validateFileUpload = (file: any, allowedTypes?: string[], maxSize?: number) => {
  if (!file) {
    throw new Error('No file provided');
  }

  if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
    throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  if (maxSize && file.size > maxSize) {
    throw new Error(`File too large. Maximum size: ${maxSize} bytes`);
  }

  return file;
};

/**
 * Batch validation for multiple items
 */
export const validateBatch = <T>(
  schema: z.ZodSchema<T>,
  items: unknown[],
  context?: string
): { valid: T[]; invalid: { index: number; errors: string[] }[] } => {
  const valid: T[] = [];
  const invalid: { index: number; errors: string[] }[] = [];

  items.forEach((item, index) => {
    const result = safeValidateData(schema, item, context);
    if (result.success && result.data) {
      valid.push(result.data);
    } else {
      invalid.push({
        index,
        errors: result.errors || ['Unknown validation error']
      });
    }
  });

  return { valid, invalid };
};

/**
 * Validates environment variables
 */
export const validateEnv = <T>(schema: z.ZodSchema<T>, env: Record<string, any> = process.env): T => {
  try {
    return schema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      validationLogger.error('Environment validation failed', { errors });
      throw new Error(`Environment validation failed: ${errors.join(', ')}`);
    }
    throw error;
  }
}; 
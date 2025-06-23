import { z } from 'zod';
import { createModuleLogger } from './logger';

const validationLogger = createModuleLogger('VALIDATION');

/**
 * Validates data against a schema and throws an error if validation fails
 * Use this in services where you want validation failures to throw errors
 */
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown, context?: string): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      const message = `Validation failed${context ? ` for ${context}` : ''}: ${errorMessages.join(', ')}`;
      validationLogger.warn('Validation error', { context, errors: error.errors, data });
      throw new Error(message);
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
  try {
    const result = schema.parse(data);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      const message = `Validation failed${context ? ` for ${context}` : ''}: ${errorMessages.join(', ')}`;
      validationLogger.warn('Safe validation error', { context, errors: error.errors, data });
      return {
        success: false,
        errors: errorMessages
      };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
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
export const validateId = (id: string, fieldName = 'id'): void => {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error(`${fieldName} is required and must be a non-empty string`);
  }
  
  // Basic CUID format validation
  if (!/^c[a-z0-9]{24}$/.test(id) && !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id)) {
    validationLogger.warn('Invalid ID format', { fieldName, id });
    throw new Error(`${fieldName} must be a valid ID format`);
  }
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
export const validateIdArray = (ids: string[], fieldName = 'ids'): void => {
  if (!Array.isArray(ids)) {
    throw new Error(`${fieldName} must be an array`);
  }
  
  if (ids.length === 0) {
    throw new Error(`${fieldName} array cannot be empty`);
  }
  
  ids.forEach((id, index) => {
    try {
      validateId(id, `${fieldName}[${index}]`);
    } catch (error) {
      throw new Error(`Invalid ID at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
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

/**
 * Validate review intervals array
 */
export function validateReviewIntervals(intervals: unknown, context: string = 'review intervals'): number[] {
  if (!Array.isArray(intervals)) {
    throw new Error(`${context} must be an array`);
  }
  
  if (intervals.length === 0) {
    throw new Error(`${context} array cannot be empty`);
  }
  
  if (intervals.length > 10) {
    throw new Error(`${context} array cannot have more than 10 intervals`);
  }
  
  const validatedIntervals: number[] = [];
  
  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i];
    
    if (typeof interval !== 'number' || !Number.isInteger(interval)) {
      throw new Error(`${context}[${i}] must be an integer`);
    }
    
    if (interval <= 0) {
      throw new Error(`${context}[${i}] must be positive (got ${interval})`);
    }
    
    if (interval > 730) { // Max 2 years
      throw new Error(`${context}[${i}] cannot exceed 730 days (got ${interval})`);
    }
    
    // Check for ascending order (optional but recommended)
    if (i > 0 && interval <= validatedIntervals[i - 1]) {
      validationLogger.warn('Review intervals not in ascending order', { 
        context, 
        interval, 
        previousInterval: validatedIntervals[i - 1],
        index: i 
      });
    }
    
    validatedIntervals.push(interval);
  }
  
  validationLogger.debug('Review intervals validated', { context, intervals: validatedIntervals });
  return validatedIntervals;
}

/**
 * Validate SM-2 ease factor
 */
export function validateEaseFactor(easeFactor: unknown, context: string = 'ease factor'): number {
  if (typeof easeFactor !== 'number') {
    throw new Error(`${context} must be a number`);
  }
  
  if (isNaN(easeFactor) || !isFinite(easeFactor)) {
    throw new Error(`${context} must be a finite number`);
  }
  
  if (easeFactor < 1.3) {
    validationLogger.warn('Ease factor below minimum', { easeFactor, context });
    return 1.3; // Clamp to minimum
  }
  
  if (easeFactor > 3.0) {
    validationLogger.warn('Ease factor above maximum', { easeFactor, context });
    return 3.0; // Clamp to maximum
  }
  
  return Math.round(easeFactor * 100) / 100; // Round to 2 decimal places
}

/**
 * Validate review quality score
 */
export function validateReviewQuality(quality: unknown, context: string = 'review quality'): number {
  if (typeof quality !== 'number' || !Number.isInteger(quality)) {
    throw new Error(`${context} must be an integer`);
  }
  
  if (quality < 0 || quality > 5) {
    throw new Error(`${context} must be between 0 and 5 (got ${quality})`);
  }
  
  return quality;
}

/**
 * Validate response quality (0-3 scale)
 */
export function validateResponseQuality(quality: unknown, context: string = 'response quality'): number {
  if (typeof quality !== 'number' || !Number.isInteger(quality)) {
    throw new Error(`${context} must be an integer`);
  }
  
  if (quality < 0 || quality > 3) {
    throw new Error(`${context} must be between 0 and 3 (0=Again, 1=Hard, 2=Good, 3=Easy)`);
  }
  
  return quality;
}

/**
 * Validate date range for queries
 */
export function validateDateRange(startDate?: string, endDate?: string, maxDays: number = 365): { startDate: Date; endDate: Date } {
  const now = new Date();
  let start: Date;
  let end: Date;
  
  // Validate and parse start date
  if (startDate) {
    start = new Date(startDate);
    if (isNaN(start.getTime())) {
      throw new Error('startDate must be a valid date string');
    }
  } else {
    start = new Date();
    start.setDate(start.getDate() - 30); // Default to 30 days ago
  }
  
  // Validate and parse end date
  if (endDate) {
    end = new Date(endDate);
    if (isNaN(end.getTime())) {
      throw new Error('endDate must be a valid date string');
    }
  } else {
    end = now;
  }
  
  // Validate date range
  if (start >= end) {
    throw new Error('startDate must be before endDate');
  }
  
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > maxDays) {
    throw new Error(`Date range cannot exceed ${maxDays} days (requested ${daysDiff} days)`);
  }
  
  // Prevent future dates
  if (end > now) {
    validationLogger.warn('End date is in the future, clamping to now', { 
      requestedEndDate: endDate, 
      clampedEndDate: now.toISOString() 
    });
    end = now;
  }
  
  return { startDate: start, endDate: end };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(limit?: unknown, offset?: unknown): { limit: number; offset: number } {
  let validatedLimit = 20; // Default limit
  let validatedOffset = 0; // Default offset
  
  if (limit !== undefined) {
    if (typeof limit === 'string') {
      validatedLimit = parseInt(limit, 10);
    } else if (typeof limit === 'number') {
      validatedLimit = Math.floor(limit);
    } else {
      throw new Error('limit must be a number or numeric string');
    }
    
    if (isNaN(validatedLimit) || validatedLimit <= 0) {
      throw new Error('limit must be a positive integer');
    }
    
    if (validatedLimit > 100) {
      validationLogger.warn('Limit exceeds maximum, clamping to 100', { requestedLimit: validatedLimit });
      validatedLimit = 100;
    }
  }
  
  if (offset !== undefined) {
    if (typeof offset === 'string') {
      validatedOffset = parseInt(offset, 10);
    } else if (typeof offset === 'number') {
      validatedOffset = Math.floor(offset);
    } else {
      throw new Error('offset must be a number or numeric string');
    }
    
    if (isNaN(validatedOffset) || validatedOffset < 0) {
      throw new Error('offset must be a non-negative integer');
    }
  }
  
  return { limit: validatedLimit, offset: validatedOffset };
}

/**
 * Sanitize and validate text input
 */
export function validateTextInput(text: unknown, fieldName: string, options: {
  minLength?: number;
  maxLength?: number;
  allowEmpty?: boolean;
  trim?: boolean;
} = {}): string {
  const { minLength = 0, maxLength = 1000, allowEmpty = false, trim = true } = options;
  
  if (text === null || text === undefined) {
    if (allowEmpty) return '';
    throw new Error(`${fieldName} is required`);
  }
  
  if (typeof text !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  
  let sanitized = trim ? text.trim() : text;
  
  if (!allowEmpty && sanitized.length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  
  if (sanitized.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters long`);
  }
  
  if (sanitized.length > maxLength) {
    throw new Error(`${fieldName} cannot exceed ${maxLength} characters`);
  }
  
  // Basic XSS prevention
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, ''); // Remove HTML tags
  
  return sanitized;
}

/**
 * Enhanced error handling wrapper
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      validationLogger.error(`Error in ${context}`, {
        context,
        error: error instanceof Error ? error.message : 'Unknown error',
        args: args.length // Don't log actual args for security
      });
      
      // Re-throw with additional context if it's a generic error
      if (error instanceof Error) {
        if (error.message === 'Unknown error' || error.message.length < 10) {
          throw new Error(`${context} failed: ${error.message}`);
        }
      }
      
      throw error;
    }
  };
} 
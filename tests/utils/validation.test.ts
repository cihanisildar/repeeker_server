import { z } from 'zod';
import { 
  validateData, 
  safeValidateData, 
  commonTransforms, 
  validateId,
  validateEmail,
  validateAndSanitizeText 
} from '../../src/utils/validation';

describe('Validation Utils', () => {
  
  describe('validateData', () => {
    const userSchema = z.object({
      name: z.string().min(2),
      age: z.number().min(0),
      email: z.string().email()
    });

    test('should validate correct data successfully', () => {
      const validData = {
        name: 'John Doe',
        age: 25,
        email: 'john@example.com'
      };

      const result = validateData(userSchema, validData);
      expect(result).toEqual(validData);
    });

    test('should throw error for invalid data', () => {
      const invalidData = {
        name: 'J', // too short
        age: -5, // negative
        email: 'invalid-email'
      };

      expect(() => {
        validateData(userSchema, invalidData);
      }).toThrow('Validation failed');
    });

    test('should throw error with context when provided', () => {
      const invalidData = { name: '', age: 10, email: 'test@test.com' };
      
      expect(() => {
        validateData(userSchema, invalidData, 'User Registration');
      }).toThrow('User Registration validation failed');
    });
  });

  describe('safeValidateData', () => {
    const simpleSchema = z.object({
      value: z.string().min(5)
    });

    test('should return success for valid data', () => {
      const validData = { value: 'hello world' };
      
      const result = safeValidateData(simpleSchema, validData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toBeUndefined();
    });

    test('should return errors for invalid data', () => {
      const invalidData = { value: 'hi' }; // too short
      
      const result = safeValidateData(simpleSchema, invalidData);
      
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('commonTransforms', () => {
    test('stringToNumber should convert string to number', () => {
      expect(commonTransforms.stringToNumber('123')).toBe(123);
      expect(commonTransforms.stringToNumber('45.67')).toBe(45.67);
      expect(commonTransforms.stringToNumber(42)).toBe(42); // already number
    });

    test('stringToNumber should throw for invalid strings', () => {
      expect(() => commonTransforms.stringToNumber('not-a-number')).toThrow('Invalid number');
    });

    test('stringToBoolean should convert string to boolean', () => {
      expect(commonTransforms.stringToBoolean('true')).toBe(true);
      expect(commonTransforms.stringToBoolean('false')).toBe(false);
      expect(commonTransforms.stringToBoolean('1')).toBe(true);
      expect(commonTransforms.stringToBoolean('0')).toBe(false);
      expect(commonTransforms.stringToBoolean(true)).toBe(true); // already boolean
    });

    test('stringToBoolean should throw for invalid values', () => {
      expect(() => commonTransforms.stringToBoolean('maybe')).toThrow('Invalid boolean value');
    });

    test('trimString should remove whitespace', () => {
      expect(commonTransforms.trimString('  hello  ')).toBe('hello');
      expect(commonTransforms.trimString('world')).toBe('world');
    });

    test('arrayFromCommaSeparated should split comma-separated string', () => {
      expect(commonTransforms.arrayFromCommaSeparated('a,b,c')).toEqual(['a', 'b', 'c']);
      expect(commonTransforms.arrayFromCommaSeparated('one, two, three')).toEqual(['one', 'two', 'three']);
      expect(commonTransforms.arrayFromCommaSeparated(['already', 'array'])).toEqual(['already', 'array']);
    });
  });

  describe('validateEmail', () => {
    test('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(email);
      });
    });

    test('should throw for invalid email addresses', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user space@example.com'
      ];

      invalidEmails.forEach(email => {
        expect(() => validateEmail(email)).toThrow('Invalid email format');
      });
    });
  });

  describe('validateAndSanitizeText', () => {
    test('should trim and validate text within length limits', () => {
      expect(validateAndSanitizeText('  hello world  ')).toBe('hello world');
      expect(validateAndSanitizeText('test', 1, 10)).toBe('test');
    });

    test('should throw for text too short', () => {
      expect(() => validateAndSanitizeText('', 1, 10)).toThrow('must be at least 1 characters');
    });

    test('should throw for text too long', () => {
      const longText = 'a'.repeat(101);
      expect(() => validateAndSanitizeText(longText, 1, 100)).toThrow('must be at most 100 characters');
    });
  });
}); 
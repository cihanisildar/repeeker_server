import { describe, it, expect } from '@jest/globals';
import { validateData, safeValidateData, validateId, validateEmail } from '../utils/validation';
import { 
  RegisterSchema, 
  LoginSchema, 
  CardCreateSchema, 
  WordListCreateSchema,
  ReviewSessionCreateSchema 
} from '../schemas';

describe('Validation Utilities', () => {
  describe('validateData', () => {
    it('should validate correct user registration data', () => {
      const validUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };
      
      expect(() => validateData(RegisterSchema, validUser, 'user registration')).not.toThrow();
      const result = validateData(RegisterSchema, validUser, 'user registration');
      expect(result).toEqual(validUser);
    });

    it('should throw error for invalid email', () => {
      const invalidUser = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };
      
      expect(() => validateData(RegisterSchema, invalidUser, 'user registration'))
        .toThrow('user registration validation failed');
    });

    it('should throw error for short password', () => {
      const invalidUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      };
      
      expect(() => validateData(RegisterSchema, invalidUser, 'user registration'))
        .toThrow('Password must be at least 6 characters');
    });
  });

  describe('safeValidateData', () => {
    it('should return success for valid data', () => {
      const validLogin = {
        email: 'john@example.com',
        password: 'password123'
      };
      
      const result = safeValidateData(LoginSchema, validLogin, 'user login');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validLogin);
      expect(result.errors).toBeUndefined();
    });

    it('should return errors for invalid data', () => {
      const invalidLogin = {
        email: 'invalid-email',
        password: ''
      };
      
      const result = safeValidateData(LoginSchema, invalidLogin, 'user login');
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain('email: Invalid email');
      expect(result.errors).toContain('password: Password is required');
    });
  });

  describe('validateId', () => {
    it('should validate correct CUID', () => {
      const validId = 'clp2h0001000008l7d8h9g2k1';
      expect(() => validateId(validId, 'test ID')).not.toThrow();
      expect(validateId(validId, 'test ID')).toBe(validId);
    });

    it('should throw error for invalid ID format', () => {
      const invalidId = 'invalid-id';
      expect(() => validateId(invalidId, 'test ID'))
        .toThrow('Invalid test ID format');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const validEmail = 'test@example.com';
      expect(() => validateEmail(validEmail)).not.toThrow();
      expect(validateEmail(validEmail)).toBe(validEmail);
    });

    it('should throw error for invalid email', () => {
      const invalidEmail = 'invalid-email';
      expect(() => validateEmail(invalidEmail))
        .toThrow('Invalid email format');
    });
  });
});

describe('Schema Validation', () => {
  describe('CardCreateSchema', () => {
    it('should validate correct card data', () => {
      const validCard = {
        word: 'ubiquitous',
        definition: 'existing or being everywhere at the same time'
      };
      
      const result = validateData(CardCreateSchema, validCard, 'card creation');
      expect(result.word).toBe(validCard.word);
      expect(result.definition).toBe(validCard.definition);
    });

    it('should reject empty word', () => {
      const invalidCard = {
        word: '',
        definition: 'some definition'
      };
      
      expect(() => validateData(CardCreateSchema, invalidCard, 'card creation'))
        .toThrow('Word is required');
    });

    it('should reject too long word', () => {
      const invalidCard = {
        word: 'a'.repeat(101),
        definition: 'some definition'
      };
      
      expect(() => validateData(CardCreateSchema, invalidCard, 'card creation'))
        .toThrow('Word too long');
    });
  });

  describe('WordListCreateSchema', () => {
    it('should validate correct word list data', () => {
      const validWordList = {
        name: 'My Vocabulary',
        description: 'A collection of important words',
        isPublic: false
      };
      
      const result = validateData(WordListCreateSchema, validWordList, 'word list creation');
      expect(result.name).toBe(validWordList.name);
      expect(result.description).toBe(validWordList.description);
      expect(result.isPublic).toBe(validWordList.isPublic);
    });

    it('should apply default value for isPublic', () => {
      const wordListWithoutPublic = {
        name: 'My Vocabulary',
        description: 'A collection of important words'
      };
      
      const result = validateData(WordListCreateSchema, wordListWithoutPublic, 'word list creation');
      expect(result.isPublic).toBe(false); // default value
    });
  });

  describe('ReviewSessionCreateSchema', () => {
    it('should validate correct review session data', () => {
      const validSession = {
        mode: 'flashcard' as const,
        cardIds: ['clp2h0001000008l7d8h9g2k1', 'clp2h0001000008l7d8h9g2k2']
      };
      
      const result = validateData(ReviewSessionCreateSchema, validSession, 'review session creation');
      expect(result.mode).toBe(validSession.mode);
      expect(result.cardIds).toEqual(validSession.cardIds);
      expect(result.isRepeat).toBe(false); // default value
    });

    it('should reject invalid mode', () => {
      const invalidSession = {
        mode: 'invalid-mode',
        cardIds: ['clp2h0001000008l7d8h9g2k1']
      };
      
      expect(() => validateData(ReviewSessionCreateSchema, invalidSession, 'review session creation'))
        .toThrow();
    });

    it('should reject empty cardIds array', () => {
      const invalidSession = {
        mode: 'flashcard' as const,
        cardIds: []
      };
      
      expect(() => validateData(ReviewSessionCreateSchema, invalidSession, 'review session creation'))
        .toThrow('At least one card is required');
    });
  });
});

describe('Data Transformation', () => {
  it('should coerce string numbers to numbers in pagination', () => {
    const queryParams = {
      page: '2',
      limit: '50',
      sortOrder: 'asc'
    };
    
    // This would be handled by the middleware, but we can test the schema directly
    const { PaginationSchema } = require('../schemas');
    const result = PaginationSchema.parse(queryParams);
    
    expect(result.page).toBe(2);
    expect(result.limit).toBe(50);
    expect(result.sortOrder).toBe('asc');
  });

  it('should apply default values', () => {
    const minimalQuery = {};
    
    const { PaginationSchema } = require('../schemas');
    const result = PaginationSchema.parse(minimalQuery);
    
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.sortOrder).toBe('desc');
  });
}); 
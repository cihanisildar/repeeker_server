import swaggerJSDoc from 'swagger-jsdoc';
import { Options } from 'swagger-jsdoc';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Repeeker Server API',
      version: '1.0.0',
      description: 'API documentation for Repeeker Server - A spaced repetition learning platform',
      contact: {
        name: 'Repeeker Team',
        url: 'https://www.repeeker.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://repeekerserver-production.up.railway.app'
          : 'http://localhost:8080',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            name: {
              type: 'string',
              nullable: true,
              description: 'User full name',
            },
            email: {
              type: 'string',
              format: 'email',
              nullable: true,
              description: 'User email address',
            },
            emailVerified: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Email verification timestamp',
            },
            image: {
              type: 'string',
              nullable: true,
              description: 'User profile image URL',
            },
            googleId: {
              type: 'string',
              nullable: true,
              description: 'Google OAuth ID',
            },
            lastTestDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Last test date',
            },
            lastReviewDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Last review date',
            },
            currentStreak: {
              type: 'integer',
              default: 0,
              description: 'Current streak count',
            },
            longestStreak: {
              type: 'integer',
              default: 0,
              description: 'Longest streak achieved',
            },
            streakUpdatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Streak last updated timestamp',
            },
          },
        },
        WordList: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Word list ID',
            },
            name: {
              type: 'string',
              description: 'Word list name',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Word list description',
            },
            isPublic: {
              type: 'boolean',
              default: false,
              description: 'Whether the list is public or private',
            },
            userId: {
              type: 'string',
              description: 'Owner user ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Card: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Card ID',
            },
            word: {
              type: 'string',
              description: 'The word to learn',
            },
            definition: {
              type: 'string',
              description: 'Word definition',
            },
            viewCount: {
              type: 'integer',
              default: 0,
              description: 'Number of times viewed',
            },
            successCount: {
              type: 'integer',
              default: 0,
              description: 'Number of successful reviews',
            },
            failureCount: {
              type: 'integer',
              default: 0,
              description: 'Number of failed reviews',
            },
            lastReviewed: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Last review timestamp',
            },
            nextReview: {
              type: 'string',
              format: 'date-time',
              description: 'Next scheduled review',
            },
            reviewStatus: {
              type: 'string',
              enum: ['ACTIVE', 'COMPLETED', 'PAUSED'],
              default: 'ACTIVE',
              description: 'Current review status',
            },
            reviewStep: {
              type: 'integer',
              default: -1,
              description: 'Current review step',
            },
            userId: {
              type: 'string',
              description: 'Owner user ID',
            },
            wordListId: {
              type: 'string',
              nullable: true,
              description: 'Associated word list ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        TestSession: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Test session ID',
            },
            userId: {
              type: 'string',
              description: 'User ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Session creation timestamp',
            },
          },
        },
        TestResult: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Test result ID',
            },
            sessionId: {
              type: 'string',
              description: 'Test session ID',
            },
            cardId: {
              type: 'string',
              description: 'Card ID',
            },
            isCorrect: {
              type: 'boolean',
              description: 'Whether the answer was correct',
            },
            timeSpent: {
              type: 'integer',
              description: 'Time spent in milliseconds',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Result timestamp',
            },
          },
        },
        ReviewSession: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Review session ID',
            },
            userId: {
              type: 'string',
              description: 'User ID',
            },
            startedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Session start timestamp',
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Session completion timestamp',
            },
            isRepeat: {
              type: 'boolean',
              default: false,
              description: 'Whether this is a repeat session',
            },
            mode: {
              type: 'string',
              description: 'Session mode (flashcard or multiple-choice)',
            },
            cards: {
              type: 'object',
              description: 'Card IDs or details for the session',
            },
          },
        },
        ReviewSchedule: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Schedule ID',
            },
            userId: {
              type: 'string',
              description: 'User ID',
            },
            intervals: {
              type: 'array',
              items: {
                type: 'integer',
              },
              description: 'Array of intervals in days',
            },
            isDefault: {
              type: 'boolean',
              default: true,
              description: 'Whether using default schedule',
            },
            name: {
              type: 'string',
              default: 'Default Schedule',
              description: 'Schedule name',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Schedule description',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        CardProgress: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Progress ID',
            },
            viewCount: {
              type: 'integer',
              default: 0,
              description: 'Number of views',
            },
            successCount: {
              type: 'integer',
              default: 0,
              description: 'Number of successes',
            },
            failureCount: {
              type: 'integer',
              default: 0,
              description: 'Number of failures',
            },
            lastReviewed: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Last review timestamp',
            },
            userId: {
              type: 'string',
              description: 'User ID',
            },
            originalCardId: {
              type: 'string',
              description: 'Original card ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        WordDetails: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Word details ID',
            },
            cardId: {
              type: 'string',
              description: 'Associated card ID',
            },
            synonyms: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of synonyms',
            },
            antonyms: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of antonyms',
            },
            examples: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of example sentences',
            },
            notes: {
              type: 'string',
              nullable: true,
              description: 'Additional notes about the word',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
            status: {
              type: 'number',
              description: 'HTTP status code',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options); 
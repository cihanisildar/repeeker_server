import { cardRepository } from '../repositories/card.repository';
import * as XLSX from 'xlsx';
import OpenAI from 'openai';
import { logger, createModuleLogger } from '../utils/logger';
import { validateData, validateId, validateIdArray, safeValidateData } from '../utils/validation';
import { CardCreateSchema, CardUpdateSchema, WordDetailsCreateSchema } from '../schemas';

const cardLogger = createModuleLogger('CARD');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to clean and format content
function cleanContent(content: any): string {
  if (!content) return '';
  return String(content).trim();
}

// Helper function to normalize column names
function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim();
}

// Helper function to analyze columns using AI
async function analyzeColumns(headers: string[], sampleData: any[]): Promise<{
  wordColumn?: string;
  definitionColumn?: string;
  exampleColumn?: string;
  synonymColumn?: string;
  antonymColumn?: string;
  notesColumn?: string;
}> {
  try {
    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      cardLogger.error('OpenAI API key is not set');
      throw new Error('OpenAI API key is not configured');
    }

    cardLogger.debug('Starting column analysis', { headers, sampleDataLength: sampleData.length });

    // Create a sample of the data for analysis
    const sample = sampleData.slice(0, 3).map(row => {
      const sampleRow: Record<string, string> = {};
      headers.forEach(header => {
        sampleRow[header] = cleanContent(row[header]);
      });
      return sampleRow;
    });

    cardLogger.debug('Prepared sample data for AI analysis', { sample });

    const prompt = `Given these Excel columns and sample data, identify which columns contain:
1. Vocabulary words
2. Definitions/meanings
3. Example sentences
4. Synonyms
5. Antonyms
6. Notes

Columns: ${headers.join(', ')}

Sample data:
${JSON.stringify(sample, null, 2)}

Return a JSON object with the column mappings:
{
  "wordColumn": "column name for vocabulary words",
  "definitionColumn": "column name for definitions",
  "exampleColumn": "column name for examples (if any)",
  "synonymColumn": "column name for synonyms (if any)",
  "antonymColumn": "column name for antonyms (if any)",
  "notesColumn": "column name for notes (if any)"
}

Only include columns that you are confident about. If you're not sure about a column's purpose, omit it from the response.`;

    cardLogger.debug('Sending request to OpenAI API');
    const model = process.env.OPENAI_MODEL || "gpt-4-turbo-preview";
    const maxTokens = 1000;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model,
      response_format: { type: "json_object" },
      max_tokens: maxTokens,
    });

    cardLogger.debug('Received response from OpenAI API');
    const response = completion.choices[0].message.content;
    if (!response) {
      cardLogger.error('Empty response received from OpenAI API');
      throw new Error('Empty response from OpenAI API');
    }

    cardLogger.debug('Parsing API response', { response });
    const columnMap = JSON.parse(response);

    // Validate the response structure
    const validKeys = ['wordColumn', 'definitionColumn', 'exampleColumn', 'synonymColumn', 'antonymColumn', 'notesColumn'];
    const invalidKeys = Object.keys(columnMap).filter(key => !validKeys.includes(key));
    
    if (invalidKeys.length > 0) {
      cardLogger.error('Invalid keys in API response', { invalidKeys });
      throw new Error(`Invalid keys in API response: ${invalidKeys.join(', ')}`);
    }

    // Validate that required columns are present
    if (!columnMap.wordColumn || !columnMap.definitionColumn) {
      cardLogger.error('Missing required columns in API response', { columnMap });
      throw new Error('API response missing required column mappings (wordColumn or definitionColumn)');
    }

    cardLogger.info('Successfully analyzed columns', { columnMap });
    return columnMap;
  } catch (error) {
    cardLogger.error('Error in analyzeColumns', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      headers,
      sampleDataLength: sampleData.length
    });

    if (error instanceof Error) {
      if (error.message.includes('rate_limit')) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (error.message.includes('authentication')) {
        throw new Error('OpenAI API authentication failed. Please check your API key.');
      }
    }
    throw new Error('Failed to analyze Excel columns');
  }
}

export const cardService = {
  async createCard(data: {
    word: string;
    definition: string;
    userId: string;
    wordListId?: string;
    wordDetails?: {
      synonyms: string[];
      antonyms: string[];
      examples: string[];
      notes?: string;
    };
  }) {
    cardLogger.info('Creating new card', { userId: data.userId, word: data.word, wordListId: data.wordListId });
    
    try {
      // Validate userId
      validateId(data.userId, 'userId');
      
      // Validate wordListId if provided
      if (data.wordListId) {
        validateId(data.wordListId, 'wordListId');
      }
      
      // Validate card data
      const validatedCardData = validateData(CardCreateSchema, {
        word: data.word,
        definition: data.definition,
        wordListId: data.wordListId
      }, 'card creation');
      
      // Validate word details if provided
      let validatedWordDetails: typeof data.wordDetails;
      if (data.wordDetails) {
        validatedWordDetails = validateData(WordDetailsCreateSchema, data.wordDetails, 'word details') as typeof data.wordDetails;
      }
      
      const result = await cardRepository.create({
        ...validatedCardData,
        userId: data.userId,
        wordDetails: validatedWordDetails
      });
      
      cardLogger.info('Card created successfully', { cardId: result.id, userId: data.userId });
      return result;
    } catch (error) {
      cardLogger.error('Failed to create card', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: data.userId,
        word: data.word
      });
      throw error;
    }
  },

  async getCards(userId: string, wordListId?: string) {
    cardLogger.debug('Fetching cards', { userId, wordListId });
    try {
      const cards = await cardRepository.findMany(userId, wordListId);
      cardLogger.debug('Cards fetched successfully', { userId, count: Array.isArray(cards) ? cards.length : 'N/A' });
      return cards;
    } catch (error) {
      cardLogger.error('Failed to fetch cards', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        wordListId
      });
      throw error;
    }
  },

  async getCard(id: string, userId: string) {
    cardLogger.debug('Fetching card by ID', { cardId: id, userId });
    try {
      const card = await cardRepository.findById(id, userId);
      if (card) {
        cardLogger.debug('Card found', { cardId: id, userId });
      } else {
        cardLogger.warn('Card not found', { cardId: id, userId });
      }
      return card || null;
    } catch (error) {
      cardLogger.error('Failed to fetch card', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        cardId: id,
        userId
      });
      throw error;
    }
  },

  async updateCard(id: string, userId: string, data: {
    word?: string;
    definition?: string;
    wordDetails?: {
      synonyms: string[];
      antonyms: string[];
      examples: string[];
      notes?: string;
    };
  }) {
    cardLogger.info('Updating card', { cardId: id, userId, updateFields: Object.keys(data) });
    try {
      const updatedCard = await cardRepository.update(id, userId, data);
      if (updatedCard) {
        cardLogger.info('Card updated successfully', { cardId: id, userId });
      } else {
        cardLogger.warn('Card not found for update', { cardId: id, userId });
      }
      return updatedCard || null;
    } catch (error) {
      cardLogger.error('Failed to update card', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        cardId: id,
        userId
      });
      throw error;
    }
  },

  async deleteCard(id: string, userId: string) {
    cardLogger.info('Deleting card', { cardId: id, userId });
    try {
      const success = await cardRepository.delete(id, userId);
      if (success) {
        cardLogger.info('Card deleted successfully', { cardId: id, userId });
      } else {
        cardLogger.warn('Card not found for deletion', { cardId: id, userId });
      }
      return success || null;
    } catch (error) {
      cardLogger.error('Failed to delete card', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        cardId: id,
        userId
      });
      throw error;
    }
  },

  async updateCardProgress(userId: string, cardId: string, isSuccess: boolean) {
    cardLogger.info('Updating card progress', { userId, cardId, isSuccess });
    try {
      const result = await cardRepository.updateProgress(userId, cardId, isSuccess);
      cardLogger.info('Card progress updated successfully', { userId, cardId, isSuccess });
      return result;
    } catch (error) {
      cardLogger.error('Failed to update card progress', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        cardId,
        isSuccess
      });
      throw error;
    }
  },

  async getTodayCards(userId: string, limit?: number) {
    cardLogger.debug('Fetching today\'s cards', { userId, limit });
    try {
      // Validate limit parameter
      if (limit !== undefined && (limit <= 0 || limit > 100)) {
        cardLogger.warn('Invalid limit parameter for today\'s cards', { userId, limit });
        throw new Error('Limit must be between 1 and 100');
      }
      
      const cards = await cardRepository.findTodayCards(userId, limit);
      cardLogger.debug('Today\'s cards fetched successfully', { 
        userId, 
        limit,
        count: cards?.cards?.length || 0,
        total: cards?.total || 0,
        hasMore: cards?.hasMore || false
      });
      return cards;
    } catch (error) {
      cardLogger.error('Failed to fetch today\'s cards', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        limit
      });
      throw error;
    }
  },

  async getStats(userId: string) {
    cardLogger.debug('Fetching card stats', { userId });
    try {
      const stats = await cardRepository.getStats(userId);
      cardLogger.debug('Card stats fetched successfully', { userId, stats });
      return stats;
    } catch (error) {
      cardLogger.error('Failed to fetch card stats', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  },

  async getUpcomingCards(userId: string, days: number = 7, startDays: number = -14) {
    cardLogger.debug('Fetching upcoming cards', { userId, days, startDays });
    try {
      const cards = await cardRepository.getUpcomingCards(userId, days, startDays);
      cardLogger.debug('Upcoming cards fetched successfully', { userId, count: cards && typeof cards === 'object' ? 'fetched' : 'N/A' });
      return cards;
    } catch (error) {
      cardLogger.error('Failed to fetch upcoming cards', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        days,
        startDays
      });
      throw error;
    }
  },

  async addToReview(userId: string, cardIds: string[]) {
    cardLogger.info('Adding cards to review', { userId, cardCount: cardIds.length });
    try {
      const result = await cardRepository.addToReview(userId, cardIds);
      cardLogger.info('Cards added to review successfully', { userId, cardCount: cardIds.length });
      return result;
    } catch (error) {
      cardLogger.error('Failed to add cards to review', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        cardIds
      });
      throw error;
    }
  },

  async reviewCard(userId: string, cardId: string, isSuccess: boolean, responseQuality?: number) {
    cardLogger.info('Reviewing card', { userId, cardId, isSuccess, responseQuality });
    try {
      // Validate responseQuality if provided (0-3 scale: Again, Hard, Good, Easy)
      if (responseQuality !== undefined && (responseQuality < 0 || responseQuality > 3)) {
        cardLogger.warn('Invalid response quality', { userId, cardId, responseQuality });
        throw new Error('Response quality must be between 0 and 3');
      }
      
      const result = await cardRepository.reviewCard(userId, cardId, isSuccess, responseQuality);
      cardLogger.info('Card reviewed successfully', { userId, cardId, isSuccess, responseQuality });
      return result;
    } catch (error) {
      cardLogger.error('Failed to review card', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        cardId,
        isSuccess,
        responseQuality
      });
      throw error;
    }
  },

  async getReviewHistory(userId: string, startDate?: string, endDate?: string, days: number = 30) {
    cardLogger.debug('Fetching review history', { userId, startDate, endDate, days });
    try {
      const history = await cardRepository.getReviewHistory(userId, startDate, endDate, days);
      cardLogger.debug('Review history fetched successfully', { userId, historyCount: history?.cards?.length || 'N/A' });
      return history;
    } catch (error) {
      cardLogger.error('Failed to fetch review history', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        startDate,
        endDate,
        days
      });
      throw error;
    }
  },

  async importCards(userId: string, fileBuffer: Buffer, wordListId?: string) {
    cardLogger.info('Starting card import process', { userId, bufferSize: fileBuffer.length, wordListId });
    
    try {
      // Read the Excel file
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        cardLogger.error('No sheets found in Excel file', { userId });
        throw new Error('No sheets found in the Excel file');
      }

      cardLogger.debug('Excel file parsed successfully', { userId, sheets: workbook.SheetNames });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!worksheet) {
        cardLogger.error('First sheet is empty or invalid', { userId });
        throw new Error('First sheet is empty or invalid');
      }

      const data = XLSX.utils.sheet_to_json(worksheet);
      if (!data || data.length === 0) {
        cardLogger.error('No data found in Excel file', { userId });
        throw new Error('No data found in the Excel file');
      }

      cardLogger.info('Excel data parsed successfully', { userId, rowCount: data.length });
      const headers = Object.keys(data[0] as object);
      cardLogger.debug('Excel headers identified', { userId, headers });

      // Use AI to analyze and map columns
      const columnMap = await analyzeColumns(headers, data);
      cardLogger.info('AI column mapping completed', { userId, columnMap });

      // Validate required columns
      if (!columnMap.wordColumn || !columnMap.definitionColumn) {
        const errorMessage = [
          'Could not identify required columns in the Excel file.',
          '',
          'Found columns:',
          headers.map(h => `- "${h}"`).join('\n'),
          '',
          'The AI analysis could not confidently identify:',
          !columnMap.wordColumn ? '- A column containing vocabulary words' : '',
          !columnMap.definitionColumn ? '- A column containing definitions/meanings' : '',
          '',
          'Please make sure your Excel file has clear column names and content that indicates:',
          '- Which column contains the vocabulary words',
          '- Which column contains the definitions or meanings',
          '',
          'You can also try renaming your columns to be more descriptive.'
        ].filter(Boolean).join('\n');

        cardLogger.error('Required columns not identified', { userId, headers, columnMap });
        throw new Error(errorMessage);
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };

      cardLogger.info('Starting batch processing of cards', { userId, totalRows: data.length });

      // Process each row
      const batchSize = 10;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        cardLogger.debug('Processing batch', { userId, batchStart: i, batchSize: batch.length });
        
        const batchPromises = batch.map(async (row, index) => {
          try {
            const r = row as any;
            const word = columnMap.wordColumn ? cleanContent(r[columnMap.wordColumn]) : '';
            const definition = columnMap.definitionColumn ? cleanContent(r[columnMap.definitionColumn]) : '';
            
            if (!word || !definition) {
              const error = `Row ${i + index + 1} missing required fields: ${JSON.stringify(row)}`;
              cardLogger.warn('Skipping row with missing data', { userId, rowIndex: i + index + 1, row });
              results.failed++;
              results.errors.push(error);
              return;
            }

            await cardRepository.create({
              word,
              definition,
              userId,
              wordListId,
              wordDetails: {
                examples: columnMap.exampleColumn && r[columnMap.exampleColumn] ? [r[columnMap.exampleColumn]] : [],
                synonyms: columnMap.synonymColumn && r[columnMap.synonymColumn] ? [r[columnMap.synonymColumn]] : [],
                antonyms: columnMap.antonymColumn && r[columnMap.antonymColumn] ? [r[columnMap.antonymColumn]] : [],
                notes: columnMap.notesColumn && r[columnMap.notesColumn] ? r[columnMap.notesColumn] : null
              }
            });
            
            results.success++;
          } catch (error) {
            const errorMessage = `Error processing row ${i + index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            cardLogger.error('Error processing row', { 
              userId, 
              rowIndex: i + index + 1, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            results.failed++;
            results.errors.push(errorMessage);
          }
        });
        await Promise.all(batchPromises);
      }

      cardLogger.info('Card import completed', { 
        userId, 
        totalRows: data.length,
        successCount: results.success,
        failedCount: results.failed,
        errorCount: results.errors.length
      });

      return results;
    } catch (error) {
      cardLogger.error('Card import failed', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },

  async getAvailableCards(userId: string, wordListId: string) {
    cardLogger.debug('Fetching available cards for word list', { userId, wordListId });
    try {
      const cards = await cardRepository.findAvailableCards(userId, wordListId);
      cardLogger.debug('Available cards fetched successfully', { userId, wordListId, count: cards.length });
      return cards;
    } catch (error) {
      cardLogger.error('Failed to fetch available cards', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        wordListId
      });
      throw error;
    }
  },
}; 
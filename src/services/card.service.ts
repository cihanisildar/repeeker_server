import { cardRepository } from '../repositories/card.repository';
import * as XLSX from 'xlsx';
import OpenAI from 'openai';

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
    // Create a sample of the data for analysis
    const sample = sampleData.slice(0, 3).map(row => {
      const sampleRow: Record<string, string> = {};
      headers.forEach(header => {
        sampleRow[header] = cleanContent(row[header]);
      });
      return sampleRow;
    });

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

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error analyzing columns:', error);
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
    return cardRepository.create(data);
  },

  async getCards(userId: string, wordListId?: string) {
    return cardRepository.findMany(userId, wordListId);
  },

  async getCard(id: string, userId: string) {
    const card = await cardRepository.findById(id, userId);
    return card || null;
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
    const updatedCard = await cardRepository.update(id, userId, data);
    return updatedCard || null;
  },

  async deleteCard(id: string, userId: string) {
    const success = await cardRepository.delete(id, userId);
    return success || null;
  },

  async updateCardProgress(userId: string, cardId: string, isSuccess: boolean) {
    return cardRepository.updateProgress(userId, cardId, isSuccess);
  },

  async getTodayCards(userId: string) {
    return cardRepository.findTodayCards(userId);
  },

  async getStats(userId: string) {
    return cardRepository.getStats(userId);
  },

  async getUpcomingCards(userId: string, days: number = 7, startDays: number = -14) {
    return cardRepository.getUpcomingCards(userId, days, startDays);
  },

  async addToReview(userId: string, cardIds: string[]) {
    return cardRepository.addToReview(userId, cardIds);
  },

  async reviewCard(userId: string, cardId: string, isSuccess: boolean) {
    return cardRepository.reviewCard(userId, cardId, isSuccess);
  },

  async getReviewHistory(userId: string, startDate?: string, endDate?: string, days: number = 30) {
    return cardRepository.getReviewHistory(userId, startDate, endDate, days);
  },

  async importCards(userId: string, fileBuffer: Buffer, wordListId?: string) {
    try {
      // Read the Excel file
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('No sheets found in the Excel file');
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!worksheet) {
        throw new Error('First sheet is empty or invalid');
      }

      const data = XLSX.utils.sheet_to_json(worksheet);
      if (!data || data.length === 0) {
        throw new Error('No data found in the Excel file');
      }

      const headers = Object.keys(data[0] as object);
      console.log('Excel headers:', headers);

      // Use AI to analyze and map columns
      const columnMap = await analyzeColumns(headers, data);
      console.log('AI column mapping:', columnMap);

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

        throw new Error(errorMessage);
      }

      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };

      // Process each row
      const batchSize = 10;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const batchPromises = batch.map(async (row, index) => {
          try {
            const r = row as any;
            const word = columnMap.wordColumn ? cleanContent(r[columnMap.wordColumn]) : '';
            const definition = columnMap.definitionColumn ? cleanContent(r[columnMap.definitionColumn]) : '';
            
            if (!word || !definition) {
              const error = `Row ${i + index + 1} missing required fields: ${JSON.stringify(row)}`;
              console.error(error);
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
            console.error(errorMessage);
            results.failed++;
            results.errors.push(errorMessage);
          }
        });
        await Promise.all(batchPromises);
      }

      return results;
    } catch (error) {
      console.error('Error in importCards:', error);
      throw error;
    }
  },
}; 
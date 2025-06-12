"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardService = void 0;
const card_repository_1 = require("../repositories/card.repository");
const XLSX = __importStar(require("xlsx"));
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
// Helper function to clean and format content
function cleanContent(content) {
    if (!content)
        return '';
    return String(content).trim();
}
// Helper function to normalize column names
function normalizeColumnName(name) {
    return name.toLowerCase().trim();
}
// Helper function to analyze columns using AI
async function analyzeColumns(headers, sampleData) {
    try {
        // Create a sample of the data for analysis
        const sample = sampleData.slice(0, 3).map(row => {
            const sampleRow = {};
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
    }
    catch (error) {
        console.error('Error analyzing columns:', error);
        throw new Error('Failed to analyze Excel columns');
    }
}
exports.cardService = {
    async createCard(data) {
        return card_repository_1.cardRepository.create(data);
    },
    async getCards(userId, wordListId) {
        return card_repository_1.cardRepository.findMany(userId, wordListId);
    },
    async getCard(id, userId) {
        const card = await card_repository_1.cardRepository.findById(id, userId);
        return card || null;
    },
    async updateCard(id, userId, data) {
        const updatedCard = await card_repository_1.cardRepository.update(id, userId, data);
        return updatedCard || null;
    },
    async deleteCard(id, userId) {
        const success = await card_repository_1.cardRepository.delete(id, userId);
        return success || null;
    },
    async updateCardProgress(userId, cardId, isSuccess) {
        return card_repository_1.cardRepository.updateProgress(userId, cardId, isSuccess);
    },
    async getTodayCards(userId) {
        return card_repository_1.cardRepository.findTodayCards(userId);
    },
    async getStats(userId) {
        return card_repository_1.cardRepository.getStats(userId);
    },
    async getUpcomingCards(userId, days = 7, startDays = -14) {
        return card_repository_1.cardRepository.getUpcomingCards(userId, days, startDays);
    },
    async addToReview(userId, cardIds) {
        return card_repository_1.cardRepository.addToReview(userId, cardIds);
    },
    async reviewCard(userId, cardId, isSuccess) {
        return card_repository_1.cardRepository.reviewCard(userId, cardId, isSuccess);
    },
    async getReviewHistory(userId, startDate, endDate, days = 30) {
        return card_repository_1.cardRepository.getReviewHistory(userId, startDate, endDate, days);
    },
    async importCards(userId, fileBuffer, wordListId) {
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
            const headers = Object.keys(data[0]);
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
                errors: []
            };
            // Process each row
            const batchSize = 10;
            for (let i = 0; i < data.length; i += batchSize) {
                const batch = data.slice(i, i + batchSize);
                const batchPromises = batch.map(async (row, index) => {
                    try {
                        const r = row;
                        const word = columnMap.wordColumn ? cleanContent(r[columnMap.wordColumn]) : '';
                        const definition = columnMap.definitionColumn ? cleanContent(r[columnMap.definitionColumn]) : '';
                        if (!word || !definition) {
                            const error = `Row ${i + index + 1} missing required fields: ${JSON.stringify(row)}`;
                            console.error(error);
                            results.failed++;
                            results.errors.push(error);
                            return;
                        }
                        await card_repository_1.cardRepository.create({
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
                    }
                    catch (error) {
                        const errorMessage = `Error processing row ${i + index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                        console.error(errorMessage);
                        results.failed++;
                        results.errors.push(errorMessage);
                    }
                });
                await Promise.all(batchPromises);
            }
            return results;
        }
        catch (error) {
            console.error('Error in importCards:', error);
            throw error;
        }
    },
};

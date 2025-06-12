"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wordListService = void 0;
const word_list_repository_1 = require("../repositories/word-list.repository");
exports.wordListService = {
    async createWordList(data) {
        return word_list_repository_1.wordListRepository.create(data);
    },
    async getWordLists(userId) {
        return word_list_repository_1.wordListRepository.findMany(userId);
    },
    async getWordList(id, userId) {
        const wordList = await word_list_repository_1.wordListRepository.findById(id, userId);
        if (!wordList) {
            throw new Error('Word list not found');
        }
        return wordList;
    },
    async updateWordList(id, userId, data) {
        const updatedWordList = await word_list_repository_1.wordListRepository.update(id, userId, data);
        if (!updatedWordList) {
            throw new Error('Word list not found');
        }
        return updatedWordList;
    },
    async deleteWordList(id, userId) {
        const wordList = await word_list_repository_1.wordListRepository.delete(id, userId);
        if (!wordList) {
            throw new Error('Word list not found');
        }
        return wordList;
    },
};

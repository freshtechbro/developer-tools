import { v4 as uuidv4 } from 'uuid';
import { fileStorageService } from '@developer-tools/server/services/file-storage.service';
import { logger } from '@developer-tools/shared/logger';
import path from 'path';
/**
 * Service for managing search history
 */
export class SearchHistoryResource {
    storageDir;
    historyFile;
    searchHistory = [];
    initialized = false;
    constructor(storageDir = 'data/search-history') {
        this.storageDir = storageDir;
        this.historyFile = path.join(this.storageDir, 'history.json');
    }
    /**
     * Initialize the search history resource
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            // Check if history file exists
            const exists = await fileStorageService.fileExists(this.historyFile);
            if (exists) {
                const historyData = await fileStorageService.readFromFile(this.historyFile);
                try {
                    this.searchHistory = JSON.parse(historyData);
                    logger.info('Search history loaded', { count: this.searchHistory.length });
                }
                catch (error) {
                    logger.error('Failed to parse search history', {
                        error: error instanceof Error ? error.message : String(error)
                    });
                    this.searchHistory = [];
                }
            }
            else {
                // Create directory if it doesn't exist
                await fileStorageService.saveToFile(this.historyFile, JSON.stringify([]), {
                    createDir: true
                });
                logger.info('Created new search history file');
            }
            this.initialized = true;
        }
        catch (error) {
            logger.error('Failed to initialize search history', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Add a new search to history
     */
    async addSearch(query, results, metadata) {
        await this.ensureInitialized();
        const entry = {
            id: uuidv4(),
            query,
            timestamp: new Date().toISOString(),
            results,
            metadata
        };
        this.searchHistory.push(entry);
        await this.saveHistory();
        logger.info('Added search to history', { id: entry.id, query });
        return entry;
    }
    /**
     * Get all search history
     */
    async getHistory(limit, offset = 0) {
        await this.ensureInitialized();
        const history = this.searchHistory
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(offset, limit ? offset + limit : undefined);
        logger.info('Retrieved search history', { count: history.length });
        return history;
    }
    /**
     * Get a specific search by ID
     */
    async getSearch(id) {
        await this.ensureInitialized();
        const entry = this.searchHistory.find(entry => entry.id === id);
        if (entry) {
            logger.info('Retrieved search entry', { id });
            return entry;
        }
        logger.info('Search entry not found', { id });
        return null;
    }
    /**
     * Delete a search from history
     */
    async deleteSearch(id) {
        await this.ensureInitialized();
        const initialLength = this.searchHistory.length;
        this.searchHistory = this.searchHistory.filter(entry => entry.id !== id);
        const wasDeleted = initialLength > this.searchHistory.length;
        if (wasDeleted) {
            await this.saveHistory();
            logger.info('Deleted search from history', { id });
        }
        else {
            logger.info('Search entry not found for deletion', { id });
        }
        return wasDeleted;
    }
    /**
     * Search through history for matching queries
     */
    async searchHistory(term) {
        await this.ensureInitialized();
        const lowerTerm = term.toLowerCase();
        const matches = this.searchHistory.filter(entry => entry.query.toLowerCase().includes(lowerTerm)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        logger.info('Searched history', { term, matchCount: matches.length });
        return matches;
    }
    /**
     * Clear all search history
     */
    async clearHistory() {
        await this.ensureInitialized();
        this.searchHistory = [];
        await this.saveHistory();
        logger.info('Cleared search history');
    }
    /**
     * Save the current history to disk
     */
    async saveHistory() {
        try {
            await fileStorageService.saveToFile(this.historyFile, JSON.stringify(this.searchHistory, null, 2), { createDir: true });
            logger.info('Saved search history', { count: this.searchHistory.length });
        }
        catch (error) {
            logger.error('Failed to save search history', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Ensure the resource is initialized
     */
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initialize();
        }
    }
}
// Export a singleton instance
export const searchHistoryResource = new SearchHistoryResource();

/**
 * Interface for a search history entry
 */
export interface SearchHistoryEntry {
    id: string;
    query: string;
    timestamp: string;
    results: string;
    metadata?: Record<string, any>;
}
/**
 * Service for managing search history
 */
export declare class SearchHistoryResource {
    private storageDir;
    private historyFile;
    private searchHistory;
    private initialized;
    constructor(storageDir?: string);
    /**
     * Initialize the search history resource
     */
    initialize(): Promise<void>;
    /**
     * Add a new search to history
     */
    addSearch(query: string, results: string, metadata?: Record<string, any>): Promise<SearchHistoryEntry>;
    /**
     * Get all search history
     */
    getHistory(limit?: number, offset?: number): Promise<SearchHistoryEntry[]>;
    /**
     * Get a specific search by ID
     */
    getSearch(id: string): Promise<SearchHistoryEntry | null>;
    /**
     * Delete a search from history
     */
    deleteSearch(id: string): Promise<boolean>;
    /**
     * Search through history for matching queries
     */
    searchHistory(term: string): Promise<SearchHistoryEntry[]>;
    /**
     * Clear all search history
     */
    clearHistory(): Promise<void>;
    /**
     * Save the current history to disk
     */
    private saveHistory;
    /**
     * Ensure the resource is initialized
     */
    private ensureInitialized;
}
export declare const searchHistoryResource: SearchHistoryResource;

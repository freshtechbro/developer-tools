import express from 'express';
import { z } from 'zod';
import { searchHistoryResource } from '../resources/search-history.resource.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Validation schemas
const AddSearchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  results: z.string(),
  metadata: z.record(z.any()).optional()
});

const SearchQuerySchema = z.object({
  term: z.string().min(1, 'Search term is required')
});

const IdParamSchema = z.object({
  id: z.string().uuid('Invalid ID format')
});

const PaginationSchema = z.object({
  limit: z.coerce.number().optional().default(20),
  offset: z.coerce.number().optional().default(0)
});

/**
 * GET /api/search-history
 * Retrieve all search history entries with pagination
 */
router.get('/', async (req, res) => {
  try {
    const { limit, offset } = PaginationSchema.parse({
      limit: req.query.limit,
      offset: req.query.offset
    });
    
    const history = await searchHistoryResource.getHistory(limit, offset);
    
    res.json({
      success: true,
      data: history,
      count: history.length,
      pagination: { limit, offset }
    });
  } catch (error) {
    logger.error('Failed to retrieve search history', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve search history'
    });
  }
});

/**
 * GET /api/search-history/search
 * Search through history for matching queries
 */
router.get('/search', async (req, res) => {
  try {
    const { term } = SearchQuerySchema.parse(req.query);
    
    const results = await searchHistoryResource.searchHistory(term);
    
    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    logger.error('Failed to search history', {
      error: error instanceof Error ? error.message : String(error),
      query: req.query
    });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid search parameters',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to search history'
    });
  }
});

/**
 * GET /api/search-history/:id
 * Get a specific search history entry by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = IdParamSchema.parse(req.params);
    
    const entry = await searchHistoryResource.getSearch(id);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Search history entry not found'
      });
    }
    
    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    logger.error('Failed to retrieve search history entry', {
      error: error instanceof Error ? error.message : String(error),
      id: req.params.id
    });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve search history entry'
    });
  }
});

/**
 * POST /api/search-history
 * Add a new search to history
 */
router.post('/', async (req, res) => {
  try {
    const { query, results, metadata } = AddSearchSchema.parse(req.body);
    
    const entry = await searchHistoryResource.addSearch(query, results, metadata);
    
    res.status(201).json({
      success: true,
      data: entry
    });
  } catch (error) {
    logger.error('Failed to add search to history', {
      error: error instanceof Error ? error.message : String(error),
      body: req.body
    });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid search data',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to add search to history'
    });
  }
});

/**
 * DELETE /api/search-history/:id
 * Delete a search history entry by ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = IdParamSchema.parse(req.params);
    
    const deleted = await searchHistoryResource.deleteSearch(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Search history entry not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Search history entry deleted'
    });
  } catch (error) {
    logger.error('Failed to delete search history entry', {
      error: error instanceof Error ? error.message : String(error),
      id: req.params.id
    });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete search history entry'
    });
  }
});

/**
 * DELETE /api/search-history
 * Clear all search history
 */
router.delete('/', async (req, res) => {
  try {
    await searchHistoryResource.clearHistory();
    
    res.json({
      success: true,
      message: 'Search history cleared'
    });
  } catch (error) {
    logger.error('Failed to clear search history', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to clear search history'
    });
  }
});

export const searchHistoryRoutes = router; 
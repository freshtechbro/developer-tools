import { webSearchTool } from '../web-search.js';
import { getProvider } from '../providers/provider-factory.js';
import { searchCacheService } from '../services/cache-service.js';
import { formatterService } from '../services/formatter-service.js';
import { PerplexityProvider } from '../providers/perplexity-provider.js';
import { GeminiProvider } from '../providers/gemini-provider.js';
import { OpenAIProvider } from '../providers/openai-provider.js';

// Mock dependencies
jest.mock('../providers/perplexity-provider.js');
jest.mock('../providers/gemini-provider.js');
jest.mock('../providers/openai-provider.js');
jest.mock('../services/cache-service.js');
jest.mock('../services/formatter-service.js');
jest.mock('../providers/provider-factory.js');

describe('Enhanced Web Search Tool', () => {
  // Setup mocks
  const mockSearch = jest.fn();
  const mockInitialize = jest.fn();
  const mockIsAvailable = jest.fn();
  const mockFormat = jest.fn();
  const mockCacheGet = jest.fn();
  const mockCacheSet = jest.fn();
  const mockCacheKey = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup provider mock
    (PerplexityProvider as jest.Mock).mockImplementation(() => ({
      name: 'perplexity',
      search: mockSearch,
      initialize: mockInitialize,
      isAvailable: mockIsAvailable
    }));
    
    (GeminiProvider as jest.Mock).mockImplementation(() => ({
      name: 'gemini',
      search: mockSearch,
      initialize: mockInitialize,
      isAvailable: mockIsAvailable
    }));
    
    (OpenAIProvider as jest.Mock).mockImplementation(() => ({
      name: 'openai',
      search: mockSearch,
      initialize: mockInitialize,
      isAvailable: mockIsAvailable
    }));
    
    // Setup factory mock
    (getProvider as jest.Mock).mockImplementation(() => ({
      name: 'perplexity',
      search: mockSearch,
      initialize: mockInitialize,
      isAvailable: mockIsAvailable
    }));
    
    // Setup formatter mock
    (formatterService.format as jest.Mock).mockImplementation(mockFormat);
    mockFormat.mockReturnValue('Formatted search results');
    
    // Setup cache mock
    (searchCacheService.get as jest.Mock).mockImplementation(mockCacheGet);
    (searchCacheService.set as jest.Mock).mockImplementation(mockCacheSet);
    (searchCacheService.generateCacheKey as jest.Mock).mockImplementation(mockCacheKey);
    mockCacheKey.mockReturnValue('test-cache-key');
    
    // Default mocked search result
    mockSearch.mockResolvedValue({
      content: 'Sample search result',
      metadata: {
        model: 'test-model',
        provider: 'perplexity',
        sources: [
          { title: 'Source 1', url: 'https://example.com/1' },
          { title: 'Source 2', url: 'https://example.com/2' }
        ]
      }
    });
    
    mockInitialize.mockResolvedValue(undefined);
    mockIsAvailable.mockResolvedValue(true);
  });
  
  it('should execute a basic search with default options', async () => {
    // Mock cache miss
    mockCacheGet.mockResolvedValue(null);
    
    const result = await webSearchTool.execute({
      query: 'Test query'
    });
    
    // Check that the provider was initialized
    expect(mockInitialize).toHaveBeenCalled();
    
    // Check that search was called with correct parameters
    expect(mockSearch).toHaveBeenCalledWith('Test query', expect.any(Object));
    
    // Check that formatter was called
    expect(mockFormat).toHaveBeenCalled();
    
    // Check result structure
    expect(result).toHaveProperty('searchResults');
    expect(result).toHaveProperty('metadata');
  });
  
  it('should use cache when available', async () => {
    // Mock cache hit
    mockCacheGet.mockResolvedValue({
      content: 'Cached search result',
      metadata: {
        model: 'test-model',
        provider: 'perplexity',
        sources: [
          { title: 'Cached Source', url: 'https://example.com/cached' }
        ]
      }
    });
    
    const result = await webSearchTool.execute({
      query: 'Test query'
    });
    
    // Check that search was NOT called
    expect(mockSearch).not.toHaveBeenCalled();
    
    // Check that cache was checked
    expect(mockCacheGet).toHaveBeenCalled();
    
    // Check that formatter was called
    expect(mockFormat).toHaveBeenCalled();
    
    // Check result structure and cached flag
    expect(result).toHaveProperty('searchResults');
    expect(result).toHaveProperty('metadata.cached', true);
  });
  
  it('should bypass cache when noCache option is true', async () => {
    // Mock cache (should not be used)
    mockCacheGet.mockResolvedValue({
      content: 'Cached search result',
      metadata: { provider: 'perplexity' }
    });
    
    const result = await webSearchTool.execute({
      query: 'Test query',
      noCache: true
    });
    
    // Check that cache was NOT checked
    expect(mockCacheGet).not.toHaveBeenCalled();
    
    // Check that search was called
    expect(mockSearch).toHaveBeenCalled();
    
    // Check result structure
    expect(result).toHaveProperty('searchResults');
    expect(result).not.toHaveProperty('metadata.cached');
  });
  
  it('should use specified provider when provided', async () => {
    // Mock cache miss
    mockCacheGet.mockResolvedValue(null);
    
    await webSearchTool.execute({
      query: 'Test query',
      provider: 'gemini'
    });
    
    // Check that provider factory was called with correct provider
    expect(getProvider).toHaveBeenCalledWith('gemini');
  });
  
  it('should format results according to specified format', async () => {
    // Mock cache miss
    mockCacheGet.mockResolvedValue(null);
    
    await webSearchTool.execute({
      query: 'Test query',
      outputFormat: 'json'
    });
    
    // Check that formatter was called with correct format
    expect(mockFormat).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        format: 'json'
      })
    );
  });
  
  it('should handle detailed search option', async () => {
    // Mock cache miss
    mockCacheGet.mockResolvedValue(null);
    
    await webSearchTool.execute({
      query: 'Test query',
      detailed: true
    });
    
    // Check that search was called with detailed option
    expect(mockSearch).toHaveBeenCalledWith(
      'Test query',
      expect.objectContaining({
        detailed: true
      })
    );
  });
}); 
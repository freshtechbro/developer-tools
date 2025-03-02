import { PerplexityProvider } from './perplexity-provider.js';
import { GeminiProvider } from './gemini-provider.js';
import { OpenAIProvider } from './openai-provider.js';
import { logger } from '@developer-tools/shared/logger';
import { config } from '@developer-tools/shared/config';
// Store provider instances to avoid creating multiple instances
const providers = new Map();
/**
 * Get a search provider by name
 * @param name Provider name (perplexity, gemini, openai)
 * @returns Provider instance
 */
export function getProvider(name) {
    // Use configured default provider if no name provided
    const providerName = name || config.apis?.defaultProvider || 'perplexity';
    // Check if we already have an instance
    if (providers.has(providerName)) {
        return providers.get(providerName);
    }
    // Create a new provider instance
    let provider;
    switch (providerName.toLowerCase()) {
        case 'perplexity':
            provider = new PerplexityProvider();
            break;
        case 'gemini':
            provider = new GeminiProvider();
            break;
        case 'openai':
            provider = new OpenAIProvider();
            break;
        default:
            logger.warn(`Unknown provider "${providerName}", falling back to Perplexity`);
            provider = new PerplexityProvider();
    }
    // Cache the provider
    providers.set(providerName, provider);
    return provider;
}
/**
 * Returns all available providers
 */
export async function getAvailableProviders() {
    const allProviders = [
        getProvider('perplexity'),
        getProvider('gemini'),
        getProvider('openai')
    ];
    // Check which providers are available (have API keys)
    const availableProviders = [];
    for (const provider of allProviders) {
        try {
            if (await provider.isAvailable()) {
                availableProviders.push(provider);
            }
        }
        catch (error) {
            logger.warn(`Provider ${provider.name} is not available`, { error });
        }
    }
    return availableProviders;
}
/**
 * Get fallback providers in order of preference
 * @param currentProvider The current provider that failed
 * @returns Array of fallback providers
 */
export async function getFallbackProviders(currentProvider) {
    const availableProviders = await getAvailableProviders();
    // Filter out the current provider
    return availableProviders.filter(provider => provider.name !== currentProvider);
}

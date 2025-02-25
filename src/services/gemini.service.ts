import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

export interface GeminiRequestOptions {
  maxOutputTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface GeminiResponse {
  content: string;
  metadata?: {
    promptTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    modelVersion?: string;
  }
}

export class GeminiService {
  private apiKey: string;
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || config.googleApiKey || '';
  }

  /**
   * Generate content using Google Gemini API
   * @param prompt The prompt to send to Gemini
   * @param options Additional options for the API call
   * @returns The generated content and metadata
   */
  async generateContent(prompt: string, options: GeminiRequestOptions = {}): Promise<GeminiResponse> {
    // Check for API key
    if (!this.apiKey) {
      const error = new Error("Google API Key not found in environment variables (GOOGLE_API_KEY)");
      logger.error("API key missing", { service: 'gemini' });
      throw error;
    }

    try {
      logger.info("Calling Gemini API", { promptLength: prompt.length });
      
      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          maxOutputTokens: options.maxOutputTokens,
          temperature: options.temperature
        }
      };
      
      // Remove undefined values from generationConfig
      Object.keys(requestBody.generationConfig).forEach(key => {
        if (requestBody.generationConfig[key] === undefined) {
          delete requestBody.generationConfig[key];
        }
      });

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${this.apiKey}`,
        requestBody,
        { timeout: options.timeout || 30000 } // 30 second timeout by default
      );

      // Handle empty or invalid response
      if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        logger.warn("Unexpected Gemini API response format", { responseData: response.data });
        throw new Error("Invalid response format from Gemini API");
      }

      const content = response.data.candidates[0].content.parts[0].text;
      
      // Extract metadata if available
      const metadata = {};
      if (response.data.usageMetadata) {
        metadata.promptTokens = response.data.usageMetadata.promptTokenCount;
        metadata.outputTokens = response.data.usageMetadata.candidatesTokenCount;
        metadata.totalTokens = response.data.usageMetadata.totalTokenCount;
      }
      
      logger.debug("Received response from Gemini API", { contentLength: content.length });
      
      return {
        content,
        metadata
      };
      
    } catch (error) {
      logger.error("Error calling Gemini API", {
        error: error instanceof Error ? error.message : String(error),
        promptLength: prompt.length
      });
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.message;
        logger.error("Axios error details", {
          status: error.response?.status,
          data: error.response?.data
        });
        
        if (error.response?.status === 400) {
          throw new Error(`Invalid request to Gemini API: ${errorMessage}`);
        } else if (error.response?.status === 401 || error.response?.status === 403) {
          throw new Error(`Authentication error with Gemini API: ${errorMessage}`);
        } else if (error.response?.status === 429) {
          throw new Error(`Rate limit exceeded for Gemini API: ${errorMessage}`);
        } else if (error.response?.status >= 500) {
          throw new Error(`Gemini API server error: ${errorMessage}`);
        }
        
        throw new Error(`Failed to communicate with Gemini API: ${errorMessage}`);
      }
      
      throw new Error(`Failed to generate content with Gemini: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export a singleton instance
export const geminiService = new GeminiService(config.googleApiKey); 
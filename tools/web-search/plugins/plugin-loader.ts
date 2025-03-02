import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '@developer-tools/shared/logger';
import { formatterService } from '../services/formatter-service.js';
import { ResultFormatter } from '../services/formatter-service.js';

// Get the directory path for plugins
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginsDir = __dirname;

/**
 * Plugin loader for web search formatters
 * Automatically loads and registers custom formatters from the plugins directory
 */
export class PluginLoader {
  /**
   * Load all formatter plugins
   */
  static async loadFormatters(): Promise<void> {
    try {
      // Read all files in the plugins directory
      const files = fs.readdirSync(pluginsDir);
      
      // Filter for TypeScript/JavaScript files that aren't this loader
      const pluginFiles = files.filter(file => 
        (file.endsWith('.js') || file.endsWith('.ts')) && 
        !file.includes('plugin-loader')
      );
      
      logger.info(`Found ${pluginFiles.length} potential formatter plugins`, { 
        plugins: pluginFiles 
      });
      
      // Load each plugin
      for (const file of pluginFiles) {
        try {
          const pluginPath = `${path.join(pluginsDir, file)}`;
          
          // Import the plugin module
          const pluginModule = await import(pluginPath);
          
          // Get the default export or the first export that implements ResultFormatter
          const FormatterClass = pluginModule.default || 
            Object.values(pluginModule).find(
              (exp): exp is new () => ResultFormatter => 
                typeof exp === 'function' && 
                exp.prototype && 
                typeof exp.prototype.formatResult === 'function'
            );
          
          if (FormatterClass) {
            // Instantiate the formatter
            const formatter = new FormatterClass();
            
            // Register the formatter
            formatterService.registerFormatter(formatter);
            
            logger.info(`Successfully registered formatter plugin: ${formatter.name}`, {
              format: formatter.format,
              file
            });
          } else {
            logger.warn(`Plugin file does not export a valid formatter: ${file}`);
          }
        } catch (pluginError) {
          logger.error(`Failed to load formatter plugin: ${file}`, {
            error: pluginError instanceof Error ? pluginError.message : String(pluginError)
          });
        }
      }
    } catch (error) {
      logger.error('Failed to load formatter plugins', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

// Export a function to initialize plugins
export async function initializePlugins(): Promise<void> {
  await PluginLoader.loadFormatters();
} 
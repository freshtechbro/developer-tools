import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../../../shared/src/logger';

export interface SaveOptions {
  createDirectory?: boolean;
  encoding?: BufferEncoding;
  flag?: string;
}

export interface ReadOptions {
  encoding?: BufferEncoding;
  flag?: string;
}

export class FileStorageService {
  /**
   * Save content to a file
   * @param filePath The path to save the file to
   * @param content The content to save
   * @param options Additional options for saving
   * @returns The absolute path to the saved file
   */
  async saveToFile(filePath: string, content: string, options: SaveOptions = {}): Promise<string> {
    try {
      const normalizedPath = path.normalize(filePath);
      const dirPath = path.dirname(normalizedPath);
      
      // Always create directory (recursive will not fail if it exists)
      await fs.mkdir(dirPath, { recursive: true });
      
      // Write the file
      await fs.writeFile(normalizedPath, content, {
        encoding: options.encoding || 'utf-8',
        flag: options.flag || 'w'
      });
      
      logger.info('File saved successfully', { path: normalizedPath });
      
      return normalizedPath;
    } catch (error) {
      logger.error('Failed to save file', {
        error: error instanceof Error ? error.message : String(error),
        path: filePath
      });
      
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Append content to a file
   * @param filePath The path to append to
   * @param content The content to append
   * @param options Additional options
   * @returns The absolute path to the file
   */
  async appendToFile(filePath: string, content: string, options: SaveOptions = {}): Promise<string> {
    return this.saveToFile(filePath, content, {
      ...options,
      flag: 'a'
    });
  }
  
  /**
   * Read content from a file
   * @param filePath The path to read from
   * @param options Additional options for reading
   * @returns The file content
   */
  async readFromFile(filePath: string, options: ReadOptions = {}): Promise<string> {
    try {
      const normalizedPath = path.normalize(filePath);
      
      const content = await fs.readFile(normalizedPath, {
        encoding: options.encoding || 'utf-8',
        flag: options.flag || 'r'
      });
      
      logger.debug('File read successfully', { path: normalizedPath });
      
      return content;
    } catch (error) {
      logger.error('Failed to read file', {
        error: error instanceof Error ? error.message : String(error),
        path: filePath
      });
      
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Check if a file exists
   * @param filePath The path to check
   * @returns True if the file exists, false otherwise
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const normalizedPath = path.normalize(filePath);
      await fs.access(normalizedPath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Delete a file
   * @param filePath The path to delete
   * @returns True if the file was deleted, false if it didn't exist
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const normalizedPath = path.normalize(filePath);
      
      await fs.unlink(normalizedPath);
      logger.info('File deleted successfully', { path: normalizedPath });
      return true;
    } catch (error) {
      // Check if the error is because the file doesn't exist
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        logger.debug('File does not exist, no deletion needed', { path: filePath });
        return false;
      }
      
      logger.error('Failed to delete file', {
        error: error instanceof Error ? error.message : String(error),
        path: filePath
      });
      
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export singleton instance
export const fileStorageService = new FileStorageService(); 
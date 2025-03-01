import { jest } from '@jest/globals';

// Create mock functions for file operations
const mockSaveToFile = jest.fn().mockResolvedValue('/mock/path');
const mockReadFromFile = jest.fn().mockResolvedValue('{}');
const mockFileExists = jest.fn().mockResolvedValue(false);
const mockDeleteFile = jest.fn().mockResolvedValue(true);
const mockAppendToFile = jest.fn().mockResolvedValue('/mock/path');

// Export mock file storage service
export const fileStorageService = {
  saveToFile: mockSaveToFile,
  readFromFile: mockReadFromFile,
  fileExists: mockFileExists,
  deleteFile: mockDeleteFile,
  appendToFile: mockAppendToFile
};

// Export class for compatibility
export class FileStorageService {
  saveToFile = mockSaveToFile;
  readFromFile = mockReadFromFile;
  fileExists = mockFileExists;
  deleteFile = mockDeleteFile;
  appendToFile = mockAppendToFile;
} 
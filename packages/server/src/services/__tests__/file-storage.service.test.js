import { jest, describe, it, expect, beforeEach } from '@jest/globals';
// Mock fs/promises module
jest.mock('fs/promises', () => ({
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue('file content'),
    access: jest.fn().mockResolvedValue(undefined),
    unlink: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({ isFile: () => true })
}));
// Mock path module
jest.mock('path', () => ({
    dirname: jest.fn().mockReturnValue('/mock/dir'),
    normalize: jest.fn().mockImplementation(p => p),
    resolve: jest.fn().mockImplementation((...args) => args.join('/')),
    join: jest.fn().mockImplementation((...args) => args.join('/'))
}));
// Import mocked modules
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileStorageService } from '../file-storage.service';
describe('FileStorageService', () => {
    let fileStorageService;
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        // Reset mock implementations
        fs.mkdir.mockResolvedValue(undefined);
        fs.writeFile.mockResolvedValue(undefined);
        fs.readFile.mockResolvedValue('file content');
        fs.access.mockResolvedValue(undefined);
        fs.unlink.mockResolvedValue(undefined);
        fileStorageService = new FileStorageService();
    });
    describe('saveToFile', () => {
        it('should save content to a file', async () => {
            const filePath = '/test/file.txt';
            const content = 'test content';
            // Set up the mock to be called
            path.dirname.mockReturnValueOnce('/mock/dir');
            const result = await fileStorageService.saveToFile(filePath, content);
            expect(path.normalize).toHaveBeenCalledWith(filePath);
            expect(path.dirname).toHaveBeenCalledWith(filePath);
            expect(fs.mkdir).toHaveBeenCalledWith('/mock/dir', { recursive: true });
            expect(fs.writeFile).toHaveBeenCalledWith(filePath, content, { encoding: 'utf-8', flag: 'w' });
            expect(result).toBe(filePath);
        });
        it('should handle Error instance when saving a file', async () => {
            const filePath = '/test/error.txt';
            const content = 'test content';
            const errorMessage = 'Failed to write file';
            // Mock writeFile to reject with an Error instance
            fs.writeFile.mockRejectedValueOnce(new Error(errorMessage));
            await expect(fileStorageService.saveToFile(filePath, content))
                .rejects.toThrow(`Failed to save file: ${errorMessage}`);
        });
        it('should handle non-Error instance when saving a file', async () => {
            const filePath = '/test/error.txt';
            const content = 'test content';
            const errorString = 'String error without stack trace';
            // Mock writeFile to reject with a string error
            fs.writeFile.mockRejectedValueOnce(errorString);
            await expect(fileStorageService.saveToFile(filePath, content))
                .rejects.toThrow(`Failed to save file: ${errorString}`);
        });
    });
    describe('readFromFile', () => {
        it('should read content from a file', async () => {
            const filePath = '/test/file.txt';
            const result = await fileStorageService.readFromFile(filePath);
            expect(fs.readFile).toHaveBeenCalledWith(filePath, { encoding: 'utf-8', flag: 'r' });
            expect(result).toBe('file content');
        });
        it('should handle Error instance when reading a file', async () => {
            const filePath = '/test/nonexistent.txt';
            const errorMessage = 'File not found';
            // Mock readFile to reject with an Error instance
            fs.readFile.mockRejectedValueOnce(new Error(errorMessage));
            await expect(fileStorageService.readFromFile(filePath))
                .rejects.toThrow(`Failed to read file: ${errorMessage}`);
        });
        it('should handle non-Error instance when reading a file', async () => {
            const filePath = '/test/nonexistent.txt';
            const errorString = 'String error without stack trace';
            // Mock readFile to reject with a string error
            fs.readFile.mockRejectedValueOnce(errorString);
            await expect(fileStorageService.readFromFile(filePath))
                .rejects.toThrow(`Failed to read file: ${errorString}`);
        });
    });
    describe('appendToFile', () => {
        it('should append content to a file', async () => {
            const filePath = '/test/append.txt';
            const content = 'appended content';
            const result = await fileStorageService.appendToFile(filePath, content);
            expect(path.normalize).toHaveBeenCalledWith(filePath);
            expect(fs.writeFile).toHaveBeenCalledWith(filePath, content, { encoding: 'utf-8', flag: 'a' });
            expect(result).toBe(filePath);
        });
        it('should create a directory if specified when appending', async () => {
            const filePath = '/test/subdir/append.txt';
            const content = 'appended content';
            // Set up the mock to be called
            path.dirname.mockReturnValueOnce('/mock/dir');
            const result = await fileStorageService.appendToFile(filePath, content, true);
            expect(path.normalize).toHaveBeenCalledWith(filePath);
            expect(path.dirname).toHaveBeenCalledWith(filePath);
            expect(fs.mkdir).toHaveBeenCalledWith('/mock/dir', { recursive: true });
            expect(fs.writeFile).toHaveBeenCalledWith(filePath, content, { encoding: 'utf-8', flag: 'a' });
            expect(result).toBe(filePath);
        });
    });
    describe('fileExists', () => {
        it('should return true if file exists', async () => {
            const filePath = '/test/exists.txt';
            const result = await fileStorageService.fileExists(filePath);
            expect(path.normalize).toHaveBeenCalledWith(filePath);
            expect(fs.access).toHaveBeenCalledWith(filePath);
            expect(result).toBe(true);
        });
        it('should return false if file does not exist', async () => {
            const filePath = '/test/nonexistent.txt';
            // Mock access to reject with an error
            fs.access.mockRejectedValueOnce(new Error('File not found'));
            const result = await fileStorageService.fileExists(filePath);
            expect(path.normalize).toHaveBeenCalledWith(filePath);
            expect(fs.access).toHaveBeenCalledWith(filePath);
            expect(result).toBe(false);
        });
    });
    describe('deleteFile', () => {
        it('should delete a file if it exists', async () => {
            const filePath = '/test/delete.txt';
            const result = await fileStorageService.deleteFile(filePath);
            expect(path.normalize).toHaveBeenCalledWith(filePath);
            expect(fs.unlink).toHaveBeenCalledWith(filePath);
            expect(result).toBe(true);
        });
        it('should return false if file does not exist', async () => {
            const filePath = '/test/nonexistent.txt';
            // Mock unlink to reject with ENOENT error
            const error = new Error('File not found');
            error.code = 'ENOENT';
            fs.unlink.mockRejectedValueOnce(error);
            const result = await fileStorageService.deleteFile(filePath);
            expect(path.normalize).toHaveBeenCalledWith(filePath);
            expect(fs.unlink).toHaveBeenCalledWith(filePath);
            expect(result).toBe(false);
        });
        it('should handle Error instance when deleting a file', async () => {
            const filePath = '/test/protected.txt';
            const errorMessage = 'Permission denied';
            // Mock unlink to reject with a non-ENOENT error
            const error = new Error(errorMessage);
            fs.unlink.mockRejectedValueOnce(error);
            await expect(fileStorageService.deleteFile(filePath))
                .rejects.toThrow(`Failed to delete file: ${errorMessage}`);
        });
        it('should handle non-Error instance when deleting a file', async () => {
            const filePath = '/test/protected.txt';
            const errorString = 'String error without stack trace';
            // Mock unlink to reject with a string error
            fs.unlink.mockRejectedValueOnce(errorString);
            await expect(fileStorageService.deleteFile(filePath))
                .rejects.toThrow(`Failed to delete file: ${errorString}`);
        });
    });
});

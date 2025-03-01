import { logger } from '../logger';

describe('Logger', () => {
  beforeEach(() => {
    // Spy on console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log info messages', () => {
    logger.info('test info message');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('test info message'));
  });

  it('should log error messages', () => {
    logger.error('test error message');
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('test error message'));
  });

  it('should log warning messages', () => {
    logger.warn('test warning message');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('test warning message'));
  });

  it('should log debug messages', () => {
    logger.debug('test debug message');
    expect(console.debug).toHaveBeenCalledWith(expect.stringContaining('test debug message'));
  });
}); 
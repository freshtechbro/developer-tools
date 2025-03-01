import * as playwright from 'playwright';
import * as path from 'path';
import { logger } from '@developer-tools/shared/logger';
import { fileStorageService } from './file-storage.service.js';

export interface BrowserOptions {
  headless?: boolean;
  timeout?: number;
  viewport?: { width: number; height: number };
  userAgent?: string;
}

export interface PageResult {
  url: string;
  title: string;
  content?: string;
  screenshot?: string;
  consoleMessages?: string[];
  networkRequests?: Array<{
    url: string;
    method: string;
    status?: number;
    contentType?: string;
  }>;
}

export class BrowserService {
  private browser: playwright.Browser | null = null;
  private context: playwright.BrowserContext | null = null;
  
  /**
   * Initialize browser instance
   * @param options Browser configuration options
   */
  async initBrowser(options: BrowserOptions = {}): Promise<void> {
    try {
      if (this.browser) {
        await this.closeBrowser();
      }
      
      logger.info('Initializing browser', { options });
      
      this.browser = await playwright.chromium.launch({
        headless: options.headless !== false, // Default to headless: true
      });
      
      this.context = await this.browser.newContext({
        viewport: options.viewport || { width: 1280, height: 720 },
        userAgent: options.userAgent
      });
      
      logger.debug('Browser initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize browser', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to initialize browser: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Navigate to a URL and collect page information
   * @param url The URL to navigate to
   * @param options Options for page navigation and data collection
   * @returns Page result with collected information
   */
  async navigateAndCollect(url: string, options: {
    captureScreenshot?: boolean;
    screenshotPath?: string;
    captureHtml?: boolean;
    captureConsole?: boolean;
    captureNetwork?: boolean;
    waitForSelector?: string;
    waitForTimeout?: number;
    executeScript?: string;
  } = {}): Promise<PageResult> {
    try {
      if (!this.browser || !this.context) {
        await this.initBrowser();
      }
      
      const page = await this.context!.newPage();
      const consoleMessages: string[] = [];
      const networkRequests: PageResult['networkRequests'] = [];
      
      // Set up listeners if needed
      if (options.captureConsole) {
        page.on('console', message => {
          consoleMessages.push(`[${message.type()}] ${message.text()}`);
        });
      }
      
      if (options.captureNetwork) {
        page.on('request', request => {
          networkRequests.push({
            url: request.url(),
            method: request.method()
          });
        });
        
        page.on('response', response => {
          const request = response.request();
          const existingRequest = networkRequests.find(r => r.url === request.url() && r.method === request.method());
          
          if (existingRequest) {
            existingRequest.status = response.status();
            existingRequest.contentType = response.headers()['content-type'];
          }
        });
      }
      
      // Navigate to the URL
      logger.info('Navigating to URL', { url });
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      
      // Wait for selector if specified
      if (options.waitForSelector) {
        logger.debug('Waiting for selector', { selector: options.waitForSelector });
        await page.waitForSelector(options.waitForSelector);
      }
      
      // Wait for timeout if specified
      if (options.waitForTimeout) {
        logger.debug('Waiting for timeout', { ms: options.waitForTimeout });
        await page.waitForTimeout(options.waitForTimeout);
      }
      
      // Execute custom script if provided
      let scriptResult: any;
      if (options.executeScript) {
        logger.debug('Executing custom script');
        scriptResult = await page.evaluate(options.executeScript);
      }
      
      // Collect page information
      const title = await page.title();
      
      // Capture HTML if requested
      let content: string | undefined;
      if (options.captureHtml) {
        content = await page.content();
      }
      
      // Capture screenshot if requested
      let screenshotPath: string | undefined;
      if (options.captureScreenshot) {
        const timestamp = Date.now();
        const filename = options.screenshotPath || path.join('screenshots', `screenshot-${timestamp}.png`);
        
        logger.debug('Capturing screenshot', { path: filename });
        
        const screenshotBuffer = await page.screenshot({ fullPage: true });
        screenshotPath = await fileStorageService.saveToFile(filename, screenshotBuffer.toString('base64'), {
          createDirectory: true
        });
      }
      
      // Close the page to free resources
      await page.close();
      
      return {
        url,
        title,
        content,
        screenshot: screenshotPath,
        consoleMessages: options.captureConsole ? consoleMessages : undefined,
        networkRequests: options.captureNetwork ? networkRequests : undefined
      };
      
    } catch (error) {
      logger.error('Error during page navigation', {
        error: error instanceof Error ? error.message : String(error),
        url
      });
      
      throw new Error(`Failed to navigate to ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Fill a form and submit it
   * @param url The URL of the form
   * @param formData Map of form field selectors to values
   * @param options Additional options
   * @returns Result of the form submission
   */
  async fillForm(url: string, formData: Record<string, string>, options: {
    submitSelector?: string;
    waitForNavigation?: boolean;
    captureScreenshot?: boolean;
    screenshotPath?: string;
  } = {}): Promise<PageResult> {
    try {
      if (!this.browser || !this.context) {
        await this.initBrowser();
      }
      
      const page = await this.context!.newPage();
      
      // Navigate to the URL
      logger.info('Navigating to form URL', { url });
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      
      // Fill form fields
      for (const [selector, value] of Object.entries(formData)) {
        logger.debug(`Filling form field: ${selector}`);
        await page.fill(selector, value);
      }
      
      // Capture screenshot before submit if requested
      let screenshotBeforePath: string | undefined;
      if (options.captureScreenshot) {
        const timestamp = Date.now();
        const filename = options.screenshotPath 
          ? `${options.screenshotPath}-before.png`
          : path.join('screenshots', `form-before-${timestamp}.png`);
        
        logger.debug('Capturing form before submission', { path: filename });
        
        const screenshotBuffer = await page.screenshot({ fullPage: true });
        screenshotBeforePath = await fileStorageService.saveToFile(filename, screenshotBuffer.toString('base64'), {
          createDirectory: true
        });
      }
      
      // Submit the form
      if (options.submitSelector) {
        logger.debug('Clicking submit button', { selector: options.submitSelector });
        await page.click(options.submitSelector);
      } else {
        logger.debug('Pressing Enter to submit form');
        await page.keyboard.press('Enter');
      }
      
      // Wait for navigation if requested
      if (options.waitForNavigation) {
        logger.debug('Waiting for navigation after form submission');
        await page.waitForLoadState('domcontentloaded');
      }
      
      // Capture post-submission information
      const title = await page.title();
      const currentUrl = page.url();
      
      // Capture screenshot after submit if requested
      let screenshotAfterPath: string | undefined;
      if (options.captureScreenshot) {
        const timestamp = Date.now();
        const filename = options.screenshotPath 
          ? `${options.screenshotPath}-after.png`
          : path.join('screenshots', `form-after-${timestamp}.png`);
        
        logger.debug('Capturing form after submission', { path: filename });
        
        const screenshotBuffer = await page.screenshot({ fullPage: true });
        screenshotAfterPath = await fileStorageService.saveToFile(filename, screenshotBuffer.toString('base64'), {
          createDirectory: true
        });
      }
      
      // Close the page
      await page.close();
      
      return {
        url: currentUrl,
        title,
        screenshot: screenshotAfterPath || screenshotBeforePath
      };
      
    } catch (error) {
      logger.error('Error during form submission', {
        error: error instanceof Error ? error.message : String(error),
        url
      });
      
      throw new Error(`Failed to submit form at ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Extract data from a webpage
   * @param url The URL to extract data from
   * @param selectors Map of data keys to CSS selectors
   * @returns Extracted data
   */
  async extractData(url: string, selectors: Record<string, string>): Promise<Record<string, string | string[]>> {
    try {
      if (!this.browser || !this.context) {
        await this.initBrowser();
      }
      
      const page = await this.context!.newPage();
      
      // Navigate to the URL
      logger.info('Navigating to URL for data extraction', { url });
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      
      // Extract data
      const result: Record<string, string | string[]> = {};
      
      for (const [key, selector] of Object.entries(selectors)) {
        logger.debug(`Extracting data for: ${key}`, { selector });
        
        // Check if this is a multi-element selector
        if (selector.startsWith('MULTI:')) {
          const actualSelector = selector.substring(6);
          const elements = await page.$$(actualSelector);
          const textValues = await Promise.all(
            elements.map(element => element.textContent())
          );
          result[key] = textValues.filter(Boolean) as string[];
        } else {
          const element = await page.$(selector);
          if (element) {
            const text = await element.textContent();
            result[key] = text || '';
          } else {
            result[key] = '';
          }
        }
      }
      
      // Close the page
      await page.close();
      
      return result;
      
    } catch (error) {
      logger.error('Error during data extraction', {
        error: error instanceof Error ? error.message : String(error),
        url
      });
      
      throw new Error(`Failed to extract data from ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Close the browser instance
   */
  async closeBrowser(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        logger.info('Browser closed successfully');
      }
    } catch (error) {
      logger.error('Error closing browser', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

// Export singleton instance
export const browserService = new BrowserService(); 
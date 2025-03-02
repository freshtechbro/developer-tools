import { z } from 'zod';
import { logger } from '@developer-tools/shared/logger';
import { browserService } from '@developer-tools/server/services/browser.service';
// Define common schemas
const BrowserOptionsSchema = z.object({
    headless: z.boolean().optional().default(true),
    viewport: z.object({
        width: z.number(),
        height: z.number()
    }).optional(),
    userAgent: z.string().optional()
});
// Schema for page navigation
const BrowserNavigateSchema = z.object({
    url: z.string().url('Invalid URL format'),
    action: z.literal('navigate'),
    options: z.object({
        captureScreenshot: z.boolean().optional().default(false),
        captureHtml: z.boolean().optional().default(false),
        captureConsole: z.boolean().optional().default(false),
        captureNetwork: z.boolean().optional().default(false),
        waitForSelector: z.string().optional(),
        waitForTimeout: z.number().optional(),
        executeScript: z.string().optional(),
        saveScreenshotTo: z.string().optional()
    }).optional().default({}),
    browserOptions: BrowserOptionsSchema.optional().default({})
});
// Schema for form submission
const BrowserFormSchema = z.object({
    url: z.string().url('Invalid URL format'),
    action: z.literal('form'),
    formData: z.record(z.string()),
    options: z.object({
        submitSelector: z.string().optional(),
        waitForNavigation: z.boolean().optional().default(true),
        captureScreenshot: z.boolean().optional().default(false),
        saveScreenshotTo: z.string().optional()
    }).optional().default({}),
    browserOptions: BrowserOptionsSchema.optional().default({})
});
// Schema for data extraction
const BrowserExtractSchema = z.object({
    url: z.string().url('Invalid URL format'),
    action: z.literal('extract'),
    selectors: z.record(z.string()),
    browserOptions: BrowserOptionsSchema.optional().default({})
});
// Union schema for all browser actions
const BrowserRequestSchema = z.discriminatedUnion('action', [
    BrowserNavigateSchema,
    BrowserFormSchema,
    BrowserExtractSchema
]);
// Schema for browser response
const BrowserResponseSchema = z.object({
    success: z.boolean(),
    url: z.string(),
    title: z.string().optional(),
    content: z.string().optional(),
    screenshot: z.string().optional(),
    consoleMessages: z.array(z.string()).optional(),
    networkRequests: z.array(z.object({
        url: z.string(),
        method: z.string(),
        status: z.number().optional(),
        contentType: z.string().optional()
    })).optional(),
    extractedData: z.record(z.union([z.string(), z.array(z.string())])).optional(),
    error: z.string().optional()
});
export const browserAutomationTool = {
    name: 'browser-automation',
    version: '0.1.0',
    description: 'Automates browser actions like navigation, form filling, and data extraction using Playwright',
    execute: async (request) => {
        // Validate request against our schema
        const validatedRequest = BrowserRequestSchema.parse(request);
        try {
            logger.info('Executing browser automation tool', {
                action: validatedRequest.action,
                url: validatedRequest.url
            });
            // Initialize browser with provided options
            await browserService.initBrowser(validatedRequest.browserOptions);
            // Handle different action types
            switch (validatedRequest.action) {
                case 'navigate': {
                    const result = await browserService.navigateAndCollect(validatedRequest.url, {
                        captureScreenshot: validatedRequest.options.captureScreenshot,
                        screenshotPath: validatedRequest.options.saveScreenshotTo,
                        captureHtml: validatedRequest.options.captureHtml,
                        captureConsole: validatedRequest.options.captureConsole,
                        captureNetwork: validatedRequest.options.captureNetwork,
                        waitForSelector: validatedRequest.options.waitForSelector,
                        waitForTimeout: validatedRequest.options.waitForTimeout,
                        executeScript: validatedRequest.options.executeScript
                    });
                    return BrowserResponseSchema.parse({
                        success: true,
                        ...result
                    });
                }
                case 'form': {
                    const result = await browserService.fillForm(validatedRequest.url, validatedRequest.formData, {
                        submitSelector: validatedRequest.options.submitSelector,
                        waitForNavigation: validatedRequest.options.waitForNavigation,
                        captureScreenshot: validatedRequest.options.captureScreenshot,
                        screenshotPath: validatedRequest.options.saveScreenshotTo
                    });
                    return BrowserResponseSchema.parse({
                        success: true,
                        ...result
                    });
                }
                case 'extract': {
                    const extractedData = await browserService.extractData(validatedRequest.url, validatedRequest.selectors);
                    return BrowserResponseSchema.parse({
                        success: true,
                        url: validatedRequest.url,
                        extractedData
                    });
                }
            }
        }
        catch (error) {
            logger.error('Browser automation failed', {
                error: error instanceof Error ? error.message : String(error),
                action: request?.action,
                url: request?.url
            });
            // Ensure we close the browser even on error
            await browserService.closeBrowser().catch(err => {
                logger.error('Failed to close browser after error', {
                    error: err instanceof Error ? err.message : String(err)
                });
            });
            if (error instanceof z.ZodError) {
                return BrowserResponseSchema.parse({
                    success: false,
                    url: request?.url || 'unknown',
                    error: `Validation error: ${error.errors[0]?.message || 'Invalid data format'}`
                });
            }
            return BrowserResponseSchema.parse({
                success: false,
                url: request?.url || 'unknown',
                error: error instanceof Error ? error.message : String(error)
            });
        }
        finally {
            // Always close the browser when done
            await browserService.closeBrowser().catch(err => {
                logger.error('Failed to close browser', {
                    error: err instanceof Error ? err.message : String(err)
                });
            });
        }
    },
    requestSchema: BrowserRequestSchema,
    responseSchema: BrowserResponseSchema
};

import { z } from 'zod';

export interface Tool {
    name: string;
    version: string;
    description: string;
    execute: (request: unknown) => Promise<unknown>;
    requestSchema: z.ZodType;
    responseSchema: z.ZodType;
} 
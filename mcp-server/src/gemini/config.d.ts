import { GoogleGenerativeAI } from '@google/generative-ai';
export declare const genAI: GoogleGenerativeAI;
export declare const geminiConfig: {
    model: string;
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
};

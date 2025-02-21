"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webSearchTool = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
exports.webSearchTool = {
    name: 'web-search',
    version: '0.1.0',
    description: 'Performs a web search using Perplexity AI.',
    execute: (request) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        if (!PERPLEXITY_API_KEY) {
            throw new Error("Perplexity API key is not set in environment variables (PERPLEXITY_API_KEY)");
        }
        const { query, saveTo } = request;
        if (!query) {
            throw new Error("Search query is required.");
        }
        try {
            console.log(`🔍 Performing web search: "${query}"`);
            const response = yield axios_1.default.post(PERPLEXITY_API_URL, {
                model: "pplx-7b-online",
                messages: [{ role: "user", content: query }]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
                }
            });
            const searchResults = ((_b = (_a = response.data.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || "No results found.";
            // If saveTo is specified, save results to file
            if (saveTo) {
                const fs = yield Promise.resolve().then(() => __importStar(require('fs/promises')));
                yield fs.writeFile(saveTo, searchResults, 'utf-8');
                console.log(`✅ Results saved to: ${saveTo}`);
                return { searchResults, savedToFile: saveTo };
            }
            return { searchResults };
        }
        catch (error) {
            console.error("❌ Error during web search:", error);
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Web search failed: ${((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) || error.message}`);
            }
            throw new Error(`Web search failed: ${error}`);
        }
    }),
    requestSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'The search query.'
            },
            saveTo: {
                type: 'string',
                description: 'Optional file path to save the search results.'
            }
        },
        required: ['query']
    },
    responseSchema: {
        type: 'object',
        properties: {
            searchResults: {
                type: 'string',
                description: 'Web search results.'
            },
            savedToFile: {
                type: 'string',
                description: 'Path to the file where results were saved, if applicable.'
            }
        },
        required: ['searchResults']
    }
};

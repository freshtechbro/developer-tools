"use strict";
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
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const playwright_1 = require("playwright");
const rest_1 = require("@octokit/rest");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
function testSetup() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 Starting dependency verification...\n');
            // Test dotenv first to load environment variables
            dotenv_1.default.config();
            console.log('✅ dotenv loaded successfully');
            // Test MCP SDK
            const server = new index_js_1.Server({
                name: "test-server",
                version: "1.0.0"
            }, {
                capabilities: {
                    resources: {},
                    tools: {}
                }
            });
            console.log('✅ MCP SDK initialized successfully');
            // Test Playwright
            console.log('\n🌐 Testing browser automation...');
            const browser = yield playwright_1.chromium.launch();
            yield browser.close();
            console.log('✅ Playwright working correctly');
            // Test Octokit
            console.log('\n📦 Testing GitHub integration...');
            const octokit = new rest_1.Octokit();
            const { status } = yield octokit.rest.meta.root();
            console.log(`✅ Octokit connected successfully (status: ${status})`);
            // Test Axios
            console.log('\n🔌 Testing HTTP client...');
            const response = yield axios_1.default.get('https://api.github.com');
            console.log(`✅ Axios working correctly (status: ${response.status})`);
            console.log('\n✨ All dependencies verified successfully!');
        }
        catch (error) {
            console.error('\n❌ Setup test failed:', error);
            process.exit(1);
        }
    });
}
testSetup();

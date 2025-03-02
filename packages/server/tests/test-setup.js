import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { chromium } from 'playwright';
import { Octokit } from '@octokit/rest';
import axios from 'axios';
import dotenv from 'dotenv';
async function testSetup() {
    try {
        console.log('🔍 Starting dependency verification...\n');
        // Test dotenv first to load environment variables
        dotenv.config();
        console.log('✅ dotenv loaded successfully');
        // Test MCP SDK
        const server = new Server({
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
        const browser = await chromium.launch();
        await browser.close();
        console.log('✅ Playwright working correctly');
        // Test Octokit
        console.log('\n📦 Testing GitHub integration...');
        const octokit = new Octokit();
        const { status } = await octokit.rest.meta.root();
        console.log(`✅ Octokit connected successfully (status: ${status})`);
        // Test Axios
        console.log('\n🔌 Testing HTTP client...');
        const response = await axios.get('https://api.github.com');
        console.log(`✅ Axios working correctly (status: ${response.status})`);
        console.log('\n✨ All dependencies verified successfully!');
    }
    catch (error) {
        console.error('\n❌ Setup test failed:', error);
        process.exit(1);
    }
}
testSetup();

import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import { logger } from '@developer-tools/shared/logger';
import { RateLimiter } from '@developer-tools/shared/rate-limiter';
import { fileStorageService } from '@developer-tools/server/services/file-storage.service';
import * as path from 'path';
// GitHub authentication token from config or environment
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
// Define schemas for the resource
const GitHubPRListRequestSchema = z.object({
    owner: z.string().min(1, "Owner is required"),
    repo: z.string().min(1, "Repository is required"),
    state: z.enum(['open', 'closed', 'all']).optional().default('open'),
    per_page: z.number().min(1).max(100).optional().default(10),
    page: z.number().min(1).optional().default(1)
});
const GitHubPRReadRequestSchema = z.object({
    owner: z.string().min(1, "Owner is required"),
    repo: z.string().min(1, "Repository is required"),
    pull_number: z.number().min(1, "Pull request number is required")
});
const GitHubPRSchema = z.object({
    id: z.number(),
    number: z.number(),
    title: z.string(),
    state: z.enum(['open', 'closed']),
    html_url: z.string().url(),
    user: z.object({
        login: z.string(),
        avatar_url: z.string().url()
    }),
    created_at: z.string(),
    updated_at: z.string(),
    body: z.string().nullable(),
    labels: z.array(z.object({
        name: z.string(),
        color: z.string()
    })),
    comments: z.number().optional(),
    commits: z.number().optional(),
    additions: z.number().optional(),
    deletions: z.number().optional(),
    changed_files: z.number().optional()
});
const GitHubPRListResponseSchema = z.object({
    resources: z.array(GitHubPRSchema)
});
const GitHubPRReadResponseSchema = z.object({
    resource: GitHubPRSchema
});
class GitHubPRResource {
    octokit;
    rateLimiter;
    initialized = false;
    cacheDir;
    constructor(config) {
        // Use provided token or fallback to environment variable
        const githubToken = config?.githubToken || GITHUB_TOKEN;
        // Use provided cache directory or fallback to default
        this.cacheDir = config?.cacheDir || path.join(process.cwd(), 'cache', 'github-pr');
        this.octokit = new Octokit({
            auth: githubToken
        });
        // Create a rate limiter for GitHub API (5000 requests per hour for authenticated requests)
        this.rateLimiter = new RateLimiter('github-api', {
            maxTokens: 5000,
            refillRate: 1.38, // ~5000 requests per hour (5000/3600)
            waitForTokens: true
        });
        logger.debug("GitHub PR resource created with rate limiter", {
            resource: 'github-pr',
            maxTokens: 5000,
            refillRate: 1.38
        });
    }
    /**
     * Initialize the resource
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        try {
            // Create cache directory if needed
            await fileStorageService.saveToFile(path.join(this.cacheDir, '.gitkeep'), '', { createDirectory: true });
            this.initialized = true;
            logger.info("GitHub PR resource initialized", { resource: 'github-pr' });
        }
        catch (error) {
            logger.error("Failed to initialize GitHub PR resource", {
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error(`Failed to initialize GitHub PR resource: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * List pull requests for a repository
     */
    async list(request) {
        try {
            // Validate request
            const validatedRequest = GitHubPRListRequestSchema.parse(request);
            const { owner, repo, state, per_page, page } = validatedRequest;
            logger.info("Listing GitHub pull requests", { owner, repo, state, page });
            // Check if results are cached
            const cacheKey = `${owner}-${repo}-${state}-${per_page}-${page}`;
            const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);
            let pullRequests;
            let fromCache = false;
            // Try to get from cache first
            if (await fileStorageService.fileExists(cachePath)) {
                try {
                    const cacheContent = await fileStorageService.readFromFile(cachePath);
                    pullRequests = JSON.parse(cacheContent);
                    fromCache = true;
                    logger.debug("Using cached GitHub PR data", { owner, repo, cachePath });
                }
                catch (error) {
                    logger.warn("Failed to read GitHub PR cache, will fetch fresh data", {
                        error: error instanceof Error ? error.message : String(error),
                        cachePath
                    });
                }
            }
            // Fetch from GitHub API if not in cache
            if (!pullRequests) {
                // Acquire a token before making the API request
                await this.rateLimiter.acquireToken();
                const response = await this.octokit.pulls.list({
                    owner,
                    repo,
                    state,
                    per_page,
                    page
                });
                pullRequests = response.data;
                // Save to cache
                try {
                    await fileStorageService.saveToFile(cachePath, JSON.stringify(pullRequests), { createDirectory: true });
                    logger.debug("Saved GitHub PR data to cache", { cachePath });
                }
                catch (error) {
                    logger.warn("Failed to cache GitHub PR data", {
                        error: error instanceof Error ? error.message : String(error),
                        cachePath
                    });
                }
            }
            // Transform and validate response
            const resources = pullRequests.map(pr => ({
                id: pr.id,
                number: pr.number,
                title: pr.title,
                state: pr.state,
                html_url: pr.html_url,
                user: {
                    login: pr.user?.login || 'unknown',
                    avatar_url: pr.user?.avatar_url || ''
                },
                created_at: pr.created_at,
                updated_at: pr.updated_at,
                body: pr.body,
                labels: pr.labels.map(label => ({
                    name: label.name || 'unknown',
                    color: label.color || 'ffffff'
                })),
                comments: pr.comments,
                commits: pr.commits,
                additions: pr.additions,
                deletions: pr.deletions,
                changed_files: pr.changed_files
            }));
            logger.info("GitHub pull requests retrieved", {
                owner,
                repo,
                count: resources.length,
                fromCache
            });
            return { resources };
        }
        catch (error) {
            logger.error("Failed to list GitHub pull requests", {
                error: error instanceof Error ? error.message : String(error),
                request
            });
            if (error instanceof z.ZodError) {
                throw new Error(`Invalid request: ${error.errors[0]?.message}`);
            }
            throw new Error(`Failed to list GitHub pull requests: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get a specific pull request
     */
    async read(request) {
        try {
            // Validate request
            const validatedRequest = GitHubPRReadRequestSchema.parse(request);
            const { owner, repo, pull_number } = validatedRequest;
            logger.info("Getting GitHub pull request", { owner, repo, pull_number });
            // Check if result is cached
            const cacheKey = `${owner}-${repo}-${pull_number}`;
            const cachePath = path.join(this.cacheDir, `pr-${cacheKey}.json`);
            let pullRequest;
            let fromCache = false;
            // Try to get from cache first
            if (await fileStorageService.fileExists(cachePath)) {
                try {
                    const cacheContent = await fileStorageService.readFromFile(cachePath);
                    pullRequest = JSON.parse(cacheContent);
                    fromCache = true;
                    logger.debug("Using cached GitHub PR data", { owner, repo, pull_number, cachePath });
                }
                catch (error) {
                    logger.warn("Failed to read GitHub PR cache, will fetch fresh data", {
                        error: error instanceof Error ? error.message : String(error),
                        cachePath
                    });
                }
            }
            // Fetch from GitHub API if not in cache
            if (!pullRequest) {
                // Acquire a token before making the API request
                await this.rateLimiter.acquireToken();
                const [prResponse, commitsResponse] = await Promise.all([
                    // Get PR details
                    this.octokit.pulls.get({
                        owner,
                        repo,
                        pull_number
                    }),
                    // Get PR commits count
                    this.octokit.pulls.listCommits({
                        owner,
                        repo,
                        pull_number,
                        per_page: 1
                    })
                ]);
                pullRequest = {
                    ...prResponse.data,
                    commits: commitsResponse.data[0] ? (await this.octokit.pulls.get({
                        owner,
                        repo,
                        pull_number
                    })).data.commits : 0
                };
                // Save to cache
                try {
                    await fileStorageService.saveToFile(cachePath, JSON.stringify(pullRequest), { createDirectory: true });
                    logger.debug("Saved GitHub PR data to cache", { cachePath });
                }
                catch (error) {
                    logger.warn("Failed to cache GitHub PR data", {
                        error: error instanceof Error ? error.message : String(error),
                        cachePath
                    });
                }
            }
            // Transform and validate response
            const resource = {
                id: pullRequest.id,
                number: pullRequest.number,
                title: pullRequest.title,
                state: pullRequest.state,
                html_url: pullRequest.html_url,
                user: {
                    login: pullRequest.user?.login || 'unknown',
                    avatar_url: pullRequest.user?.avatar_url || ''
                },
                created_at: pullRequest.created_at,
                updated_at: pullRequest.updated_at,
                body: pullRequest.body,
                labels: (pullRequest.labels || []).map(label => ({
                    name: label.name || 'unknown',
                    color: label.color || 'ffffff'
                })),
                comments: pullRequest.comments,
                commits: pullRequest.commits,
                additions: pullRequest.additions,
                deletions: pullRequest.deletions,
                changed_files: pullRequest.changed_files
            };
            logger.info("GitHub pull request retrieved", {
                owner,
                repo,
                pull_number,
                fromCache
            });
            return { resource };
        }
        catch (error) {
            logger.error("Failed to get GitHub pull request", {
                error: error instanceof Error ? error.message : String(error),
                request
            });
            if (error instanceof z.ZodError) {
                throw new Error(`Invalid request: ${error.errors[0]?.message}`);
            }
            throw new Error(`Failed to get GitHub pull request: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
// Export a singleton instance
export const githubPrResource = new GitHubPRResource();
// Export schemas
export { GitHubPRListRequestSchema, GitHubPRReadRequestSchema, GitHubPRSchema, GitHubPRListResponseSchema, GitHubPRReadResponseSchema };
// Export the resource
export { GitHubPRResource };

import { z } from 'zod';
declare const GitHubPRListRequestSchema: any;
declare const GitHubPRReadRequestSchema: any;
declare const GitHubPRSchema: any;
declare const GitHubPRListResponseSchema: any;
declare const GitHubPRReadResponseSchema: any;
export interface GitHubPRResourceConfig {
    githubToken?: string;
    cacheDir?: string;
}
declare class GitHubPRResource {
    private octokit;
    private rateLimiter;
    private initialized;
    private readonly cacheDir;
    constructor(config?: GitHubPRResourceConfig);
    /**
     * Initialize the resource
     */
    initialize(): Promise<void>;
    /**
     * List pull requests for a repository
     */
    list(request: z.infer<typeof GitHubPRListRequestSchema>): Promise<z.infer<typeof GitHubPRListResponseSchema>>;
    /**
     * Get a specific pull request
     */
    read(request: z.infer<typeof GitHubPRReadRequestSchema>): Promise<z.infer<typeof GitHubPRReadResponseSchema>>;
}
export declare const githubPrResource: GitHubPRResource;
export { GitHubPRListRequestSchema, GitHubPRReadRequestSchema, GitHubPRSchema, GitHubPRListResponseSchema, GitHubPRReadResponseSchema };
export { GitHubPRResource };

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getSearchInstance } from '../shared/search-instance.js';
import {
  formatJsonResponse,
  formatNoResultsResponse,
} from '../shared/response-formatters.js';
import { withErrorHandling } from '../shared/error-handlers.js';

export function register(server: McpServer): void {
  server.registerTool(
    'search_babylon_docs',
    {
      description:
        'Search Babylon.js documentation for API references, guides, and tutorials',
      inputSchema: {
        query: z.string().describe('Search query for Babylon.js documentation'),
        category: z
          .string()
          .optional()
          .describe('Optional category filter (e.g., "api", "tutorial", "guide")'),
        limit: z
          .number()
          .optional()
          .default(5)
          .describe('Maximum number of results to return (default: 5)'),
      },
    },
    withErrorHandling(
      async ({ query, category, limit = 5 }) => {
        const search = await getSearchInstance();
        const options = category ? { category, limit } : { limit };
        const results = await search.search(query, options);

        if (results.length === 0) {
          return formatNoResultsResponse(query, 'documentation');
        }

        // Format results for better readability
        const formattedResults = results.map((result, index) => ({
          rank: index + 1,
          title: result.title,
          description: result.description,
          url: result.url,
          category: result.category,
          relevance: (result.score * 100).toFixed(1) + '%',
          snippet: result.content,
          keywords: result.keywords,
        }));

        return formatJsonResponse({
          query,
          totalResults: results.length,
          results: formattedResults,
        });
      },
      'searching documentation'
    )
  );
}

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
    'search_babylon_source',
    {
      description: 'Search Babylon.js source code files',
      inputSchema: {
        query: z
          .string()
          .describe(
            'Search query for source code (e.g., "getMeshByName implementation", "scene rendering")'
          ),
        package: z
          .string()
          .optional()
          .describe('Optional package filter (e.g., "core", "gui", "materials")'),
        limit: z
          .number()
          .optional()
          .default(5)
          .describe('Maximum number of results to return (default: 5)'),
      },
    },
    withErrorHandling(
      async ({ query, package: packageFilter, limit = 5 }) => {
        const search = await getSearchInstance();
        const options = packageFilter ? { package: packageFilter, limit } : { limit };
        const results = await search.searchSourceCode(query, options);

        if (results.length === 0) {
          return formatNoResultsResponse(query, 'source code');
        }

        // Format results for better readability
        const formattedResults = results.map((result, index) => ({
          rank: index + 1,
          filePath: result.filePath,
          package: result.package,
          startLine: result.startLine,
          endLine: result.endLine,
          language: result.language,
          codeSnippet:
            result.content.substring(0, 500) +
            /* c8 ignore next */
            (result.content.length > 500 ? '...' : ''),
          imports: result.imports,
          exports: result.exports,
          url: result.url,
          relevance: (result.score * 100).toFixed(1) + '%',
        }));

        return formatJsonResponse({
          query,
          totalResults: results.length,
          results: formattedResults,
        });
      },
      'searching source code'
    )
  );
}

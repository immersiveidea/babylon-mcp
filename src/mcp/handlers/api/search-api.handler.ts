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
    'search_babylon_api',
    {
      description:
        'Search Babylon.js API documentation (classes, methods, properties)',
      inputSchema: {
        query: z
          .string()
          .describe(
            'Search query for Babylon.js API (e.g., "getMeshByName", "Vector3", "Scene")'
          ),
        limit: z
          .number()
          .optional()
          .default(5)
          .describe('Maximum number of results to return (default: 5)'),
      },
    },
    withErrorHandling(
      async ({ query, limit = 5 }) => {
        const search = await getSearchInstance();
        const results = await search.searchApi(query, { limit });

        if (results.length === 0) {
          return formatNoResultsResponse(query, 'API documentation');
        }

        // Format results for better readability
        const formattedResults = results.map((result, index) => ({
          rank: index + 1,
          name: result.name,
          fullName: result.fullName,
          kind: result.kind,
          summary: result.summary,
          description: result.description,
          parameters: result.parameters ? JSON.parse(result.parameters) : [],
          returns: result.returns ? JSON.parse(result.returns) : null,
          type: result.type,
          examples: result.examples,
          deprecated: result.deprecated,
          see: result.see,
          since: result.since,
          sourceFile: result.sourceFile,
          sourceLine: result.sourceLine,
          url: result.url,
          relevance: (result.score * 100).toFixed(1) + '%',
        }));

        return formatJsonResponse({
          query,
          totalResults: results.length,
          results: formattedResults,
        });
      },
      'searching API documentation'
    )
  );
}

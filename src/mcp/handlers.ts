import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function setupHandlers(server: McpServer): void {
  registerSearchDocsTool(server);
  registerGetDocTool(server);
}

function registerSearchDocsTool(server: McpServer): void {
  server.registerTool(
    'search_babylon_docs',
    {
      description: 'Search Babylon.js documentation for API references, guides, and tutorials',
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
    async ({ query, category, limit = 5 }) => {
      // TODO: Implement actual search logic
      const result = {
        message: 'Search functionality not yet implemented',
        query,
        category,
        limit,
        results: [],
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}

function registerGetDocTool(server: McpServer): void {
  server.registerTool(
    'get_babylon_doc',
    {
      description: 'Retrieve full content of a specific Babylon.js documentation page',
      inputSchema: {
        path: z.string().describe('Documentation file path or topic identifier'),
      },
    },
    async ({ path }) => {
      // TODO: Implement actual document retrieval
      const result = {
        message: 'Document retrieval not yet implemented',
        path,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}

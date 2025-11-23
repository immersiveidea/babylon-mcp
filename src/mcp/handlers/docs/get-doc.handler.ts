import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getSearchInstance } from '../shared/search-instance.js';
import {
  formatJsonResponse,
  formatNotFoundResponse,
} from '../shared/response-formatters.js';
import { withErrorHandling } from '../shared/error-handlers.js';

export function register(server: McpServer): void {
  server.registerTool(
    'get_babylon_doc',
    {
      description:
        'Retrieve full content of a specific Babylon.js documentation page',
      inputSchema: {
        path: z.string().describe('Documentation file path or topic identifier'),
      },
    },
    withErrorHandling(
      async ({ path }) => {
        const search = await getSearchInstance();
        const document = await search.getDocumentByPath(path);

        if (!document) {
          return formatNotFoundResponse(
            path,
            'Document',
            'The path may be incorrect or the documentation has not been indexed.'
          );
        }

        // Parse stringified fields back to arrays
        const breadcrumbs = document.breadcrumbs
          ? document.breadcrumbs.split(' > ').filter(Boolean)
          : [];
        const headings = document.headings
          ? document.headings.split(' | ').filter(Boolean)
          : [];
        const keywords = document.keywords
          ? document.keywords.split(', ').filter(Boolean)
          : [];
        const playgroundIds = document.playgroundIds
          ? document.playgroundIds.split(', ').filter(Boolean)
          : [];

        return formatJsonResponse({
          title: document.title,
          description: document.description,
          url: document.url,
          category: document.category,
          breadcrumbs,
          content: document.content,
          headings,
          keywords,
          playgroundIds,
          lastModified: document.lastModified,
        });
      },
      'retrieving document'
    )
  );
}

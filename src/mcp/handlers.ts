import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { LanceDBSearch } from '../search/lancedb-search.js';

let searchInstance: LanceDBSearch | null = null;

async function getSearchInstance(): Promise<LanceDBSearch> {
  if (!searchInstance) {
    searchInstance = new LanceDBSearch();
    await searchInstance.initialize();
  }
  return searchInstance;
}

export function setupHandlers(server: McpServer): void {
  registerSearchDocsTool(server);
  registerGetDocTool(server);
  registerSearchApiTool(server);
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
      try {
        const search = await getSearchInstance();
        const options = category ? { category, limit } : { limit };
        const results = await search.search(query, options);

        if (results.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No results found for "${query}". Try different search terms or check if the documentation has been indexed.`,
              },
            ],
          };
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

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  query,
                  totalResults: results.length,
                  results: formattedResults,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error searching documentation: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
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
      try {
        const search = await getSearchInstance();
        const document = await search.getDocumentByPath(path);

        if (!document) {
          return {
            content: [
              {
                type: 'text',
                text: `Document not found: ${path}. The path may be incorrect or the documentation has not been indexed.`,
              },
            ],
          };
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

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
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
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error retrieving document: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}

function registerSearchApiTool(server: McpServer): void {
  server.registerTool(
    'search_babylon_api',
    {
      description: 'Search Babylon.js API documentation (classes, methods, properties)',
      inputSchema: {
        query: z.string().describe('Search query for Babylon.js API (e.g., "getMeshByName", "Vector3", "Scene")'),
        limit: z.number().optional().default(5).describe('Maximum number of results to return (default: 5)'),
      },
    },
    async ({ query, limit = 5 }) => {
      try {
        const search = await getSearchInstance();
        const results = await search.searchApi(query, { limit });

        if (results.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No API documentation found for "${query}". Try different search terms or check if the API has been indexed.`,
              },
            ],
          };
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

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  query,
                  totalResults: results.length,
                  results: formattedResults,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error searching API documentation: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}

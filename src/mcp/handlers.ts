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
  registerSearchSourceTool(server);
  registerGetSourceTool(server);
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

function registerSearchSourceTool(server: McpServer): void {
  server.registerTool(
    'search_babylon_source',
    {
      description: 'Search Babylon.js source code files',
      inputSchema: {
        query: z.string().describe('Search query for source code (e.g., "getMeshByName implementation", "scene rendering")'),
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
    async ({ query, package: packageFilter, limit = 5 }) => {
      try {
        const search = await getSearchInstance();
        const options = packageFilter ? { package: packageFilter, limit } : { limit };
        const results = await search.searchSourceCode(query, options);

        if (results.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No source code found for "${query}". Try different search terms or check if the source code has been indexed.`,
              },
            ],
          };
        }

        // Format results for better readability
        const formattedResults = results.map((result, index) => ({
          rank: index + 1,
          filePath: result.filePath,
          package: result.package,
          startLine: result.startLine,
          endLine: result.endLine,
          language: result.language,
          codeSnippet: result.content.substring(0, 500) + (result.content.length > 500 ? '...' : ''),
          imports: result.imports,
          exports: result.exports,
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
              text: `Error searching source code: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}

function registerGetSourceTool(server: McpServer): void {
  server.registerTool(
    'get_babylon_source',
    {
      description: 'Retrieve full Babylon.js source code file or specific line range',
      inputSchema: {
        filePath: z.string().describe('Relative file path from repository root (e.g., "packages/dev/core/src/scene.ts")'),
        startLine: z
          .number()
          .optional()
          .describe('Optional start line number (1-indexed)'),
        endLine: z
          .number()
          .optional()
          .describe('Optional end line number (1-indexed)'),
      },
    },
    async ({ filePath, startLine, endLine }) => {
      try {
        const search = await getSearchInstance();
        const sourceCode = await search.getSourceFile(filePath, startLine, endLine);

        if (!sourceCode) {
          return {
            content: [
              {
                type: 'text',
                text: `Source file not found: ${filePath}. The path may be incorrect or the file does not exist in the repository.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  filePath,
                  startLine: startLine || 1,
                  endLine: endLine || sourceCode.split('\n').length,
                  totalLines: sourceCode.split('\n').length,
                  language: filePath.endsWith('.ts') || filePath.endsWith('.tsx') ? 'typescript' : 'javascript',
                  content: sourceCode,
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
              text: `Error retrieving source file: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}

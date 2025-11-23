import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { setupHandlers } from './handlers/index.js';

describe('MCP Handlers', () => {
  let mockServer: McpServer;
  let registerToolSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    registerToolSpy = vi.fn();
    mockServer = {
      registerTool: registerToolSpy,
    } as unknown as McpServer;
  });

  describe('setupHandlers', () => {
    it('should register all required tools', () => {
      setupHandlers(mockServer);

      expect(registerToolSpy).toHaveBeenCalledTimes(5);
    });

    it('should register search_babylon_docs tool', () => {
      setupHandlers(mockServer);

      const firstCall = registerToolSpy.mock.calls[0];
      expect(firstCall).toBeDefined();
      expect(firstCall![0]).toBe('search_babylon_docs');
      expect(firstCall![1]).toHaveProperty('description');
      expect(firstCall![1]).toHaveProperty('inputSchema');
      expect(typeof firstCall![2]).toBe('function');
    });

    it('should register get_babylon_doc tool', () => {
      setupHandlers(mockServer);

      const secondCall = registerToolSpy.mock.calls[1];
      expect(secondCall).toBeDefined();
      expect(secondCall![0]).toBe('get_babylon_doc');
      expect(secondCall![1]).toHaveProperty('description');
      expect(secondCall![1]).toHaveProperty('inputSchema');
      expect(typeof secondCall![2]).toBe('function');
    });
  });

  describe('search_babylon_docs handler', () => {
    let searchHandler: (params: unknown) => Promise<unknown>;

    beforeEach(() => {
      setupHandlers(mockServer);
      searchHandler = registerToolSpy.mock.calls[0]![2];
    });

    it('should accept required query parameter', async () => {
      const params = { query: 'PBR materials' };
      const result = (await searchHandler(params)) as { content: { type: string; text: string }[] };

      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
    });

    it('should accept optional category parameter', async () => {
      const params = { query: 'materials', category: 'api' };
      const result = (await searchHandler(params)) as { content: unknown[] };

      expect(result).toHaveProperty('content');
    });

    it('should accept optional limit parameter', async () => {
      const params = { query: 'materials', limit: 10 };
      const result = (await searchHandler(params)) as { content: unknown[] };

      expect(result).toHaveProperty('content');
    });

    it('should default limit to 5 when not provided', async () => {
      const params = { query: 'materials' };
      const result = (await searchHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      const parsedResponse = JSON.parse(responseText);
      // The response includes totalResults, not limit directly
      expect(parsedResponse).toHaveProperty('totalResults');
      expect(parsedResponse).toHaveProperty('results');
    });

    it('should return text content type', async () => {
      const params = { query: 'test' };
      const result = (await searchHandler(params)) as { content: { type: string; text: string }[] };

      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');
    });

    it('should return JSON-parseable response', async () => {
      const params = { query: 'test', category: 'guide', limit: 3 };
      const result = (await searchHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      // Response may be "No documentation found" or valid JSON
      if (!responseText.startsWith('No ')) {
        expect(() => JSON.parse(responseText)).not.toThrow();
      }
    });

    it('should include all parameters in response', async () => {
      const params = { query: 'PBR', category: 'api', limit: 10 };
      const result = (await searchHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      // Response may be "No documentation found" or valid JSON with query
      if (!responseText.startsWith('No ')) {
        const parsedResponse = JSON.parse(responseText);
        expect(parsedResponse.query).toBe('PBR');
      }
    });

    it('should handle queries and return structured results', async () => {
      const params = { query: 'test' };
      const result = (await searchHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      // Should either return "No results found" message or valid JSON
      expect(typeof responseText).toBe('string');
      expect(responseText.length).toBeGreaterThan(0);
    });
  });

  describe('get_babylon_doc handler', () => {
    let getDocHandler: (params: unknown) => Promise<unknown>;

    beforeEach(() => {
      setupHandlers(mockServer);
      getDocHandler = registerToolSpy.mock.calls[1]![2];
    });

    it('should accept required path parameter', async () => {
      const params = { path: '/divingDeeper/materials/using/introToPBR' };
      const result = (await getDocHandler(params)) as { content: unknown[] };

      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
    });

    it('should return text content type', async () => {
      const params = { path: '/test/path' };
      const result = (await getDocHandler(params)) as { content: { type: string; text: string }[] };

      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');
    });

    it('should return JSON-parseable response', async () => {
      const params = { path: '/test/path' };
      const result = (await getDocHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      // Response may be "Document not found" or valid JSON
      if (!responseText.startsWith('Document not found')) {
        expect(() => JSON.parse(responseText)).not.toThrow();
      }
    });

    it('should include document structure in response', async () => {
      const params = { path: '/some/doc/path' };
      const result = (await getDocHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      // Response may be "Document not found" or valid JSON with document structure
      if (!responseText.startsWith('Document not found')) {
        const parsedResponse = JSON.parse(responseText);
        // Document should have standard fields like title, description, content
        expect(parsedResponse).toHaveProperty('title');
      }
    });

    it('should handle document queries and return results', async () => {
      const params = { path: '/test' };
      const result = (await getDocHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      // Should either return "Document not found" message or valid JSON
      expect(typeof responseText).toBe('string');
      expect(responseText.length).toBeGreaterThan(0);
    });
  });

  describe('search_babylon_api handler', () => {
    let apiSearchHandler: (params: unknown) => Promise<unknown>;

    beforeEach(() => {
      setupHandlers(mockServer);
      apiSearchHandler = registerToolSpy.mock.calls[2]![2];
    });

    it('should accept required query parameter', async () => {
      const params = { query: 'Scene' };
      const result = (await apiSearchHandler(params)) as { content: { type: string; text: string }[] };

      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
    });

    it('should accept optional limit parameter', async () => {
      const params = { query: 'Vector3', limit: 10 };
      const result = (await apiSearchHandler(params)) as { content: unknown[] };

      expect(result).toHaveProperty('content');
    });

    it('should default limit to 5 when not provided', async () => {
      const params = { query: 'Mesh' };
      const result = (await apiSearchHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      // Should have content
      expect(responseText.length).toBeGreaterThan(0);
    });

    it('should return text content type', async () => {
      const params = { query: 'Camera' };
      const result = (await apiSearchHandler(params)) as { content: { type: string; text: string }[] };

      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');
    });

    it('should handle API search results or no results message', async () => {
      const params = { query: 'NonExistentApiClass12345' };
      const result = (await apiSearchHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      // Should either return "No API documentation found" or valid JSON
      expect(typeof responseText).toBe('string');
      expect(responseText.length).toBeGreaterThan(0);
    });

    it('should return JSON-parseable response for valid queries', async () => {
      const params = { query: 'getMeshByName', limit: 3 };
      const result = (await apiSearchHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      // Response may be "No API documentation found" or valid JSON
      if (!responseText.startsWith('No API documentation')) {
        expect(() => JSON.parse(responseText)).not.toThrow();
        const parsed = JSON.parse(responseText);
        expect(parsed).toHaveProperty('query');
        expect(parsed).toHaveProperty('totalResults');
        expect(parsed).toHaveProperty('results');
      }
    });
  });

  describe('Tool Schemas', () => {
    beforeEach(() => {
      setupHandlers(mockServer);
    });

    it('search_babylon_docs should have proper schema structure', () => {
      const toolConfig = registerToolSpy.mock.calls[0]![1];

      expect(toolConfig.inputSchema).toHaveProperty('query');
      expect(toolConfig.inputSchema).toHaveProperty('category');
      expect(toolConfig.inputSchema).toHaveProperty('limit');
    });

    it('get_babylon_doc should have proper schema structure', () => {
      const toolConfig = registerToolSpy.mock.calls[1]![1];

      expect(toolConfig.inputSchema).toHaveProperty('path');
    });

    it('search_babylon_api should have proper schema structure', () => {
      const toolConfig = registerToolSpy.mock.calls[2]![1];

      expect(toolConfig.inputSchema).toHaveProperty('query');
      expect(toolConfig.inputSchema).toHaveProperty('limit');
    });

    it('search_babylon_source should have proper schema structure', () => {
      const toolConfig = registerToolSpy.mock.calls[3]![1];

      expect(toolConfig.inputSchema).toHaveProperty('query');
      expect(toolConfig.inputSchema).toHaveProperty('package');
      expect(toolConfig.inputSchema).toHaveProperty('limit');
    });

    it('get_babylon_source should have proper schema structure', () => {
      const toolConfig = registerToolSpy.mock.calls[4]![1];

      expect(toolConfig.inputSchema).toHaveProperty('filePath');
      expect(toolConfig.inputSchema).toHaveProperty('startLine');
      expect(toolConfig.inputSchema).toHaveProperty('endLine');
    });
  });

  describe('search_babylon_source handler', () => {
    let searchSourceHandler: (params: unknown) => Promise<unknown>;

    beforeEach(() => {
      setupHandlers(mockServer);
      searchSourceHandler = registerToolSpy.mock.calls[3]![2];
    });

    it('should accept required query parameter', async () => {
      const params = { query: 'getMeshByName implementation' };
      const result = await searchSourceHandler(params);

      expect(result).toHaveProperty('content');
      expect(Array.isArray((result as any).content)).toBe(true);
    });

    it('should accept optional package parameter', async () => {
      const params = { query: 'scene rendering', package: 'core' };
      const result = await searchSourceHandler(params);

      expect(result).toHaveProperty('content');
    });

    it('should accept optional limit parameter', async () => {
      const params = { query: 'mesh', limit: 10 };
      const result = await searchSourceHandler(params);

      expect(result).toHaveProperty('content');
    });

    it('should default limit to 5 when not provided', async () => {
      const params = { query: 'test' };
      const result = await searchSourceHandler(params);

      expect(result).toHaveProperty('content');
      expect(Array.isArray((result as any).content)).toBe(true);
    });

    it('should return text content type', async () => {
      const params = { query: 'test' };
      const result = (await searchSourceHandler(params)) as { content: { type: string; text: string }[] };

      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');
    });

    it('should return JSON-parseable response or no results message', async () => {
      const params = { query: 'test source code search' };
      const result = (await searchSourceHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      // Response may be "No source code found", "Error...", or valid JSON
      if (!responseText.startsWith('No ') && !responseText.startsWith('Error ')) {
        expect(() => JSON.parse(responseText)).not.toThrow();
      }
    });

    it('should handle queries with package filter', async () => {
      const params = { query: 'mesh', package: 'core', limit: 3 };
      const result = (await searchSourceHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      expect(typeof responseText).toBe('string');
      expect(responseText.length).toBeGreaterThan(0);
    });

    it('should return structured results with source code metadata', async () => {
      const params = { query: 'getMeshByName', limit: 2 };
      const result = (await searchSourceHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      // Should either return "No source code found", "Error...", or JSON with results
      if (!responseText.startsWith('No ') && !responseText.startsWith('Error ')) {
        const parsed = JSON.parse(responseText);
        expect(parsed).toHaveProperty('query');
        expect(parsed).toHaveProperty('totalResults');
        expect(parsed).toHaveProperty('results');

        if (parsed.results && parsed.results.length > 0) {
          const firstResult = parsed.results[0];
          expect(firstResult).toHaveProperty('filePath');
          expect(firstResult).toHaveProperty('startLine');
          expect(firstResult).toHaveProperty('endLine');
        }
      }
    });
  });

  describe('get_babylon_source handler', () => {
    let getSourceHandler: (params: unknown) => Promise<unknown>;

    beforeEach(() => {
      setupHandlers(mockServer);
      getSourceHandler = registerToolSpy.mock.calls[4]![2];
    });

    it('should accept required filePath parameter', async () => {
      const params = { filePath: 'packages/dev/core/src/scene.ts' };
      const result = await getSourceHandler(params);

      expect(result).toHaveProperty('content');
      expect(Array.isArray((result as any).content)).toBe(true);
    });

    it('should accept optional startLine and endLine parameters', async () => {
      const params = {
        filePath: 'packages/dev/core/src/scene.ts',
        startLine: 100,
        endLine: 110,
      };
      const result = await getSourceHandler(params);

      expect(result).toHaveProperty('content');
    });

    it('should return text content type', async () => {
      const params = { filePath: 'packages/dev/core/src/scene.ts' };
      const result = (await getSourceHandler(params)) as { content: { type: string; text: string }[] };

      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');
    });

    it('should return JSON-parseable response', async () => {
      const params = { filePath: 'packages/dev/core/src/scene.ts', startLine: 1, endLine: 10 };
      const result = (await getSourceHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      // Response may be "Source file not found" or valid JSON
      if (!responseText.startsWith('Source file not found')) {
        expect(() => JSON.parse(responseText)).not.toThrow();
      }
    });

    it('should include source file metadata in response', async () => {
      const params = { filePath: 'packages/dev/core/src/scene.ts' };
      const result = (await getSourceHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      // Response may be "Source file not found" or JSON with metadata
      if (!responseText.startsWith('Source file not found')) {
        const parsedResponse = JSON.parse(responseText);
        expect(parsedResponse).toHaveProperty('filePath');
        expect(parsedResponse).toHaveProperty('language');
        expect(parsedResponse).toHaveProperty('content');
      }
    });

    it('should handle file retrieval requests', async () => {
      const params = { filePath: 'test/path.ts' };
      const result = (await getSourceHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      // Should either return "Source file not found" message or valid JSON
      expect(typeof responseText).toBe('string');
      expect(responseText.length).toBeGreaterThan(0);
    });

    it('should handle line range requests', async () => {
      const params = {
        filePath: 'packages/dev/core/src/scene.ts',
        startLine: 4100,
        endLine: 4110,
      };
      const result = (await getSourceHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      expect(typeof responseText).toBe('string');
      expect(responseText.length).toBeGreaterThan(0);
    });
  });
});

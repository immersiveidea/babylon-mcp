import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { setupHandlers } from './handlers.js';

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

      expect(registerToolSpy).toHaveBeenCalledTimes(2);
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
      expect(parsedResponse.limit).toBe(5);
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
      expect(() => JSON.parse(responseText)).not.toThrow();
    });

    it('should include all parameters in response', async () => {
      const params = { query: 'PBR', category: 'api', limit: 10 };
      const result = (await searchHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      const parsedResponse = JSON.parse(responseText);
      expect(parsedResponse.query).toBe('PBR');
      expect(parsedResponse.category).toBe('api');
      expect(parsedResponse.limit).toBe(10);
    });

    it('should indicate not yet implemented', async () => {
      const params = { query: 'test' };
      const result = (await searchHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      const parsedResponse = JSON.parse(responseText);
      expect(parsedResponse.message).toContain('not yet implemented');
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
      expect(() => JSON.parse(responseText)).not.toThrow();
    });

    it('should include path in response', async () => {
      const params = { path: '/some/doc/path' };
      const result = (await getDocHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      const parsedResponse = JSON.parse(responseText);
      expect(parsedResponse.path).toBe('/some/doc/path');
    });

    it('should indicate not yet implemented', async () => {
      const params = { path: '/test' };
      const result = (await getDocHandler(params)) as { content: { type: string; text: string }[] };

      const responseText = result.content[0]!.text;
      const parsedResponse = JSON.parse(responseText);
      expect(parsedResponse.message).toContain('not yet implemented');
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
  });
});

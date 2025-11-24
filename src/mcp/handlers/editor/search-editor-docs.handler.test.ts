import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as searchEditorDocsHandler from './search-editor-docs.handler.js';
import * as searchInstance from '../shared/search-instance.js';

vi.mock('../shared/search-instance.js', () => ({
  getSearchInstance: vi.fn(),
}));

describe('search-editor-docs.handler', () => {
  let mockServer: McpServer;
  let mockSearch: any;

  beforeEach(() => {
    mockServer = {
      registerTool: vi.fn(),
    } as any;

    mockSearch = {
      search: vi.fn(),
    };

    vi.mocked(searchInstance.getSearchInstance).mockResolvedValue(mockSearch);
  });

  describe('register', () => {
    it('should register search_babylon_editor_docs tool with correct metadata', () => {
      searchEditorDocsHandler.register(mockServer);

      expect(mockServer.registerTool).toHaveBeenCalledWith(
        'search_babylon_editor_docs',
        expect.objectContaining({
          description:
            'Search Babylon.js Editor documentation for tool usage, workflows, and features',
          inputSchema: expect.any(Object),
        }),
        expect.any(Function)
      );
    });

    it('should define input schema with query, category, and limit', () => {
      searchEditorDocsHandler.register(mockServer);

      const callArgs = vi.mocked(mockServer.registerTool).mock.calls[0];
      const schema = callArgs![1];

      expect(schema.inputSchema).toHaveProperty('query');
      expect(schema.inputSchema).toHaveProperty('category');
      expect(schema.inputSchema).toHaveProperty('limit');
    });
  });

  describe('handler execution', () => {
    let handler: Function;

    beforeEach(() => {
      searchEditorDocsHandler.register(mockServer);
      const callArgs = vi.mocked(mockServer.registerTool).mock.calls[0];
      handler = callArgs![2];
    });

    it('should search with query and filter to editor-docs source', async () => {
      mockSearch.search.mockResolvedValue([
        {
          title: 'Adding Scripts',
          description: 'Learn to attach scripts',
          content: 'Scripts can be attached...',
          url: 'https://editor.babylonjs.com/documentation/adding-scripts',
          category: 'editor/adding-scripts',
          source: 'editor-docs',
          score: 0.95,
          keywords: ['scripts', 'editor'],
        },
        {
          title: 'Vector3 Class',
          description: 'Core documentation',
          content: 'Vector3 is...',
          url: 'https://doc.babylonjs.com/typedoc/classes/Vector3',
          category: 'api',
          source: 'documentation',
          score: 0.85,
        },
      ]);

      const result = await handler({ query: 'scripts' });

      expect(result.content[0].text).toContain('Adding Scripts');
      expect(result.content[0].text).not.toContain('Vector3');
      expect(result.content[0].text).toContain('editor-docs');
    });

    it('should apply category filter with editor/ prefix', async () => {
      mockSearch.search.mockResolvedValue([
        {
          title: 'Customizing Scripts',
          description: 'Advanced scripting',
          content: 'Customize your scripts...',
          url: 'https://editor.babylonjs.com/documentation/scripting/customizing-scripts',
          category: 'editor/scripting',
          source: 'editor-docs',
          score: 0.92,
          keywords: ['scripting', 'editor'],
        },
      ]);

      const result = await handler({
        query: 'lifecycle',
        category: 'scripting',
      });

      expect(mockSearch.search).toHaveBeenCalledWith('lifecycle', {
        category: 'editor/scripting',
        limit: 5,
      });
      expect(result.content[0].text).toContain('Customizing Scripts');
    });

    it('should respect limit parameter', async () => {
      mockSearch.search.mockResolvedValue([
        {
          title: 'Doc 1',
          description: 'Description',
          content: 'Content',
          url: 'https://editor.babylonjs.com/doc1',
          category: 'editor',
          source: 'editor-docs',
          score: 0.9,
          keywords: [],
        },
      ]);

      await handler({ query: 'test', limit: 3 });

      expect(mockSearch.search).toHaveBeenCalledWith('test', { limit: 9 });
    });

    it('should return no results message when no editor docs found', async () => {
      mockSearch.search.mockResolvedValue([
        {
          title: 'Non-editor doc',
          description: 'Regular doc',
          content: 'Content',
          url: 'https://doc.babylonjs.com/test',
          category: 'api',
          source: 'documentation',
          score: 0.8,
          keywords: [],
        },
      ]);

      const result = await handler({ query: 'nonexistent' });

      expect(result.content[0].text).toContain('No Editor documentation found');
    });

    it('should format results with rank, relevance, and snippet', async () => {
      mockSearch.search.mockResolvedValue([
        {
          title: 'Creating Project',
          description: 'Start a new project',
          content: 'To create a project...',
          url: 'https://editor.babylonjs.com/documentation/creating-project',
          category: 'editor/creating-project',
          source: 'editor-docs',
          score: 0.95,
          keywords: ['project', 'editor'],
        },
      ]);

      const result = await handler({ query: 'project' });
      const resultText = result.content[0].text;

      expect(resultText).toContain('"rank": 1');
      expect(resultText).toContain('"title": "Creating Project"');
      expect(resultText).toContain('"relevance": "95.0%"');
      expect(resultText).toContain('"snippet": "To create a project..."');
    });

    it('should handle search errors gracefully', async () => {
      mockSearch.search.mockRejectedValue(new Error('Search failed'));

      const result = await handler({ query: 'test' });

      expect(result.content[0].text).toContain('Error');
      expect(result.content[0].text).toContain('Search failed');
    });
  });
});

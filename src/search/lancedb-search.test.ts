import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LanceDBSearch } from './lancedb-search.js';

// Mock the dependencies
vi.mock('@lancedb/lancedb', () => ({
  connect: vi.fn(() => Promise.resolve({
    openTable: vi.fn(() => Promise.resolve({
      vectorSearch: vi.fn(() => ({
        limit: vi.fn(() => ({
          where: vi.fn(() => ({
            toArray: vi.fn(() => Promise.resolve([
              {
                title: 'Test Doc',
                description: 'Test description',
                content: 'Test content with materials keyword for searching',
                url: 'https://example.com',
                category: 'test',
                _distance: 0.2,
                keywords: 'test, materials',
              },
            ])),
          })),
          toArray: vi.fn(() => Promise.resolve([
            {
              title: 'Test Doc',
              description: 'Test description',
              content: 'Test content',
              url: 'https://example.com',
              category: 'test',
              _distance: 0.2,
              keywords: 'test',
            },
          ])),
        })),
      })),
      query: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            toArray: vi.fn(() => Promise.resolve([
              {
                id: 'test-id',
                title: 'Test',
                content: 'Test content',
                filePath: '/test/path.md',
              },
            ])),
          })),
        })),
      })),
    })),
    tableNames: vi.fn(() => Promise.resolve(['babylon_docs'])),
  })),
}));

vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn(() => Promise.resolve((_text: string) => ({
    data: new Float32Array([0.1, 0.2, 0.3]),
  }))),
}));

vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn((path: string) => {
      if (path.includes('existing')) {
        return Promise.resolve('# Test Content\n\nThis is test markdown.');
      }
      return Promise.reject(new Error('File not found'));
    }),
  },
}));

describe('LanceDBSearch', () => {
  let search: LanceDBSearch;

  beforeEach(async () => {
    search = new LanceDBSearch('./data/lancedb', 'babylon_docs');
    await search.initialize();
  });

  describe('initialize', () => {
    it('should initialize database connection and embedder', async () => {
      const newSearch = new LanceDBSearch();
      await newSearch.initialize();
      // If it doesn't throw, initialization succeeded
      expect(true).toBe(true);
    });
  });

  describe('search', () => {
    it('should perform basic search', async () => {
      const results = await search.search('materials');

      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('title');
      expect(results[0]).toHaveProperty('description');
      expect(results[0]).toHaveProperty('content');
      expect(results[0]).toHaveProperty('url');
      expect(results[0]).toHaveProperty('category');
      expect(results[0]).toHaveProperty('score');
      expect(results[0]).toHaveProperty('keywords');
    });

    it('should accept custom limit option', async () => {
      const results = await search.search('test', { limit: 10 });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should accept category filter option', async () => {
      const results = await search.search('test', { category: 'api' });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should calculate score from distance', async () => {
      const results = await search.search('test');
      expect(results[0]!.score).toBeGreaterThan(0);
      expect(results[0]!.score).toBeLessThanOrEqual(1);
    });

    it('should throw error if not initialized', async () => {
      const uninitSearch = new LanceDBSearch();
      await expect(uninitSearch.search('test')).rejects.toThrow(
        'Search not initialized'
      );
    });
  });

  describe('searchApi', () => {
    it('should search API documentation', async () => {
      const results = await search.searchApi('getMeshByName');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should accept limit option for API search', async () => {
      const results = await search.searchApi('Scene', { limit: 10 });
      expect(Array.isArray(results)).toBe(true);
    });

    it('should throw error if not initialized', async () => {
      const uninitSearch = new LanceDBSearch();
      await expect(uninitSearch.searchApi('test')).rejects.toThrow(
        'Search not initialized'
      );
    });
  });

  describe('getDocument', () => {
    it('should retrieve document by ID', async () => {
      const doc = await search.getDocument('test-id');
      expect(doc).toBeDefined();
      expect(doc).toHaveProperty('id', 'test-id');
    });

    it('should return null for non-existent document', async () => {
      // Mock empty result
      const mockTable = await (search as any).table;
      mockTable.query = vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            toArray: vi.fn(() => Promise.resolve([])),
          })),
        })),
      }));

      const doc = await search.getDocument('non-existent');
      expect(doc).toBeNull();
    });

    it('should throw error if not initialized', async () => {
      const uninitSearch = new LanceDBSearch();
      await expect(uninitSearch.getDocument('test')).rejects.toThrow(
        'Search not initialized'
      );
    });
  });

  describe('getDocumentByPath', () => {
    it('should retrieve document by path/URL', async () => {
      const doc = await search.getDocumentByPath('/test/path');
      expect(doc).toBeDefined();
    });

    it('should throw error if not initialized', async () => {
      const uninitSearch = new LanceDBSearch();
      await expect(uninitSearch.getDocumentByPath('test')).rejects.toThrow(
        'Search not initialized'
      );
    });
  });

  describe('close', () => {
    it('should close without error', async () => {
      await expect(search.close()).resolves.not.toThrow();
    });
  });
});

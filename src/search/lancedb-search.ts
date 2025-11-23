import { connect } from '@lancedb/lancedb';
import { pipeline } from '@xenova/transformers';
import type { SearchOptions, SearchResult } from './types.js';
import type { EmbeddedDocument } from './lancedb-indexer.js';
import type { EmbeddedApiDoc } from './api-indexer.js';
import fs from 'fs/promises';
import path from 'path';

export class LanceDBSearch {
  private db: any;
  private table: any;
  private embedder: any;
  private readonly dbPath: string;
  private readonly tableName: string;

  constructor(
    dbPath: string = './data/lancedb',
    tableName: string = 'babylon_docs'
  ) {
    this.dbPath = dbPath;
    this.tableName = tableName;
  }

  async initialize(): Promise<void> {
    this.db = await connect(this.dbPath);
    this.table = await this.db.openTable(this.tableName);

    this.embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    if (!this.table || !this.embedder) {
      throw new Error('Search not initialized. Call initialize() first.');
    }

    const limit = options.limit || 5;
    const queryVector = await this.generateEmbedding(query);

    // Build the search query
    let searchQuery = this.table.vectorSearch(queryVector).limit(limit);

    // Apply category filter if provided
    if (options.category) {
      searchQuery = searchQuery.where(`category = '${options.category}'`);
    }

    const results = await searchQuery.toArray();

    return results.map((doc: any) => ({
      title: doc.title,
      description: doc.description,
      content: this.extractRelevantSnippet(doc.content, query),
      url: doc.url,
      category: doc.category,
      score: doc._distance ? 1 - doc._distance : 0, // Convert distance to similarity score
      keywords: doc.keywords.split(', ').filter(Boolean),
    }));
  }

  async searchApi(query: string, options: { limit?: number } = {}): Promise<Array<EmbeddedApiDoc & { score: number }>> {
    if (!this.db || !this.embedder) {
      throw new Error('Search not initialized. Call initialize() first.');
    }

    const limit = options.limit || 5;
    const queryVector = await this.generateEmbedding(query);

    // Open the API table (use babylon_api for production, babylon_api_test for testing)
    const apiTable = await this.db.openTable('babylon_api');

    // Perform vector search
    const results = await apiTable
      .vectorSearch(queryVector)
      .limit(limit)
      .toArray();

    return results.map((doc: any) => ({
      ...doc,
      score: doc._distance ? 1 - doc._distance : 0, // Convert distance to similarity score
    }));
  }

  async getDocument(docId: string): Promise<EmbeddedDocument | null> {
    if (!this.table) {
      throw new Error('Search not initialized. Call initialize() first.');
    }

    const results = await this.table
      .query()
      .where(`id = '${docId}'`)
      .limit(1)
      .toArray();

    return results.length > 0 ? results[0] : null;
  }

  async getDocumentByPath(filePath: string): Promise<EmbeddedDocument | null> {
    if (!this.table) {
      throw new Error('Search not initialized. Call initialize() first.');
    }

    // Try to find document by URL first
    let results = await this.table
      .query()
      .where(`url = '${filePath}'`)
      .limit(1)
      .toArray();

    if (results.length > 0) {
      const doc = results[0];
      // Fetch fresh content from local file if available
      const freshContent = await this.fetchLocalContent(doc.filePath);
      if (freshContent) {
        return { ...doc, content: freshContent };
      }
      return doc;
    }

    // If not found by URL, try by docId conversion
    const docId = this.pathToDocId(filePath);
    return this.getDocument(docId);
  }

  private async fetchLocalContent(filePath: string): Promise<string | null> {
    try {
      // Check if the file exists in our local repositories
      const possiblePaths = [
        filePath,
        path.join('./data/repositories/Documentation', filePath.replace(/^.*\/content\//, '')),
        path.join('./data/repositories/Babylon.js', filePath.replace(/^.*\/Babylon\.js\//, '')),
        path.join('./data/repositories/havok', filePath.replace(/^.*\/havok\//, '')),
      ];

      for (const possiblePath of possiblePaths) {
        try {
          const content = await fs.readFile(possiblePath, 'utf-8');
          return content;
        } catch {
          // Continue to next path
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embedder) {
      throw new Error('Embedder not initialized');
    }

    const result = await this.embedder(text, {
      pooling: 'mean',
      normalize: true,
    });

    return Array.from(result.data);
  }

  private extractRelevantSnippet(content: string, query: string, snippetLength: number = 300): string {
    // Simple snippet extraction - find first occurrence of query terms
    const queryTerms = query.toLowerCase().split(/\s+/);

    let bestIndex = 0;
    let maxMatches = 0;

    // Find the position with most query term matches
    const words = content.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const windowText = words.slice(i, i + 50).join(' ').toLowerCase();
      const matches = queryTerms.filter(term => windowText.includes(term)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestIndex = i;
      }
    }

    // Extract snippet around best match
    const start = Math.max(0, bestIndex - 10);
    const snippetWords = words.slice(start, start + 60);
    let snippet = snippetWords.join(' ');

    if (snippet.length > snippetLength) {
      snippet = snippet.substring(0, snippetLength) + '...';
    }

    if (start > 0) {
      snippet = '...' + snippet;
    }

    return snippet;
  }

  private pathToDocId(filePath: string): string {
    // Remove .md extension if present
    let normalizedPath = filePath.replace(/\.md$/, '');

    // If path already starts with content/, strip everything before it
    normalizedPath = normalizedPath.replace(/^.*\/content\//, '');

    // If path doesn't have content/ prefix, assume it's relative to content/
    // and prepend Documentation_content_ to match indexing
    const pathWithUnderscores = normalizedPath.replace(/\//g, '_');
    return `Documentation_content_${pathWithUnderscores}`;
  }

  async searchSourceCode(
    query: string,
    options: { package?: string; limit?: number; tableName?: string } = {}
  ): Promise<Array<any & { score: number }>> {
    if (!this.db || !this.embedder) {
      throw new Error('Search not initialized');
    }

    const limit = options.limit || 5;
    const tableName = options.tableName || 'babylon_source_code';
    const queryVector = await this.generateEmbedding(query);

    const sourceTable = await this.db.openTable(tableName);
    let searchQuery = sourceTable.vectorSearch(queryVector).limit(limit);

    if (options.package) {
      searchQuery = searchQuery.where(`package = '${options.package}'`);
    }

    const results = await searchQuery.toArray();
    return results.map((doc: any) => ({
      ...doc,
      score: doc._distance ? Math.max(0, 1 - doc._distance) : 0,
    }));
  }

  async getSourceFile(
    filePath: string,
    startLine?: number,
    endLine?: number
  ): Promise<string | null> {
    try {
      const fullPath = path.join('./data/repositories/Babylon.js', filePath);
      const content = await fs.readFile(fullPath, 'utf-8');

      if (startLine !== undefined && endLine !== undefined) {
        const lines = content.split('\n');
        return lines.slice(startLine - 1, endLine).join('\n');
      }
      return content;
    } catch (error) {
      console.error(`Error reading source file ${filePath}:`, error);
      return null;
    }
  }

  async close(): Promise<void> {
    // LanceDB doesn't require explicit closing
  }
}

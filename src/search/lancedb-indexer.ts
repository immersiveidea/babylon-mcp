import { connect } from '@lancedb/lancedb';
import { pipeline } from '@xenova/transformers';
import { DocumentParser } from './document-parser.js';
import type { DocumentMetadata } from './types.js';
import fs from 'fs/promises';
import path from 'path';

export interface EmbeddedDocument {
  id: string;
  title: string;
  description: string;
  content: string;
  keywords: string;
  category: string;
  breadcrumbs: string;
  filePath: string;
  url: string;
  source: string;
  headings: string;
  codeSnippets: string;
  playgroundIds: string;
  lastModified: string;
  vector: number[];
}

export interface DocumentSource {
  name: string;
  path: string;
  urlPrefix: string;
}

export class LanceDBIndexer {
  private db: any;
  private embedder: any;
  private parser: DocumentParser;
  private readonly dbPath: string;
  private readonly tableName: string;
  private readonly sources: DocumentSource[];

  constructor(
    dbPath: string = './data/lancedb',
    sources: DocumentSource[] = [
      {
        name: 'documentation',
        path: './data/repositories/Documentation/content',
        urlPrefix: 'https://doc.babylonjs.com',
      },
    ],
    tableName: string = 'babylon_docs'
  ) {
    this.dbPath = dbPath;
    this.sources = sources;
    this.tableName = tableName;
    this.parser = new DocumentParser();
  }

  async initialize(): Promise<void> {
    console.log('Initializing LanceDB connection...');
    this.db = await connect(this.dbPath);

    // Log which backend is being used
    const backend = process.env.ONNXRUNTIME_BACKEND;
    if (backend === 'wasm') {
      console.log('Using WASM backend for Transformers.js (Alpine/musl compatibility mode)');
    } else {
      console.log('Using native ONNX Runtime backend (glibc required)');
    }

    console.log('Loading embedding model (this may take a moment)...');
    this.embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('Embedding model loaded successfully');
  }

  async indexDocuments(): Promise<void> {
    if (!this.embedder) {
      throw new Error('Indexer not initialized. Call initialize() first.');
    }

    const allDocuments: EmbeddedDocument[] = [];

    // Process each documentation source
    for (const source of this.sources) {
      console.log(`\nProcessing source: ${source.name}`);
      console.log(`Path: ${source.path}`);
      console.log('Finding markdown files...');

      const markdownFiles = await this.findMarkdownFiles(source.path);
      console.log(`Found ${markdownFiles.length} markdown files in ${source.name}`);

      console.log('Parsing and embedding documents...');

      for (let i = 0; i < markdownFiles.length; i++) {
        const filePath = markdownFiles[i];
        if (!filePath) continue;

        try {
          const doc = await this.processDocument(filePath, source);
          allDocuments.push(doc);

          if ((i + 1) % 50 === 0) {
            console.log(`Processed ${i + 1}/${markdownFiles.length} documents from ${source.name}`);
          }
        } catch (error) {
          console.error(`Error processing ${filePath}:`, error);
        }
      }

      console.log(`✓ Completed ${source.name}: ${markdownFiles.length} files processed`);
    }

    console.log(`\nTotal documents processed: ${allDocuments.length}`);
    console.log('Creating LanceDB table...');

    // Drop existing table if it exists
    const tableNames = await this.db.tableNames();
    if (tableNames.includes(this.tableName)) {
      await this.db.dropTable(this.tableName);
    }

    // Create new table with embedded documents
    await this.db.createTable(this.tableName, allDocuments);
    console.log('Indexing complete!');
  }

  private async processDocument(filePath: string, source: DocumentSource): Promise<EmbeddedDocument> {
    const metadata = await this.parser.parseFile(filePath);
    const embeddingText = this.createEmbeddingText(metadata);
    const vector = await this.generateEmbedding(embeddingText);

    return {
      id: this.generateDocId(filePath, source),
      title: metadata.title,
      description: metadata.description,
      content: this.truncateContent(metadata.content, 20000),
      keywords: metadata.keywords.join(', '),
      category: metadata.category,
      breadcrumbs: metadata.breadcrumbs.join(' > '),
      filePath: metadata.filePath,
      url: this.generateDocUrl(metadata, source),
      source: source.name,
      headings: metadata.headings.map(h => h.text).join(' | '),
      codeSnippets: metadata.codeBlocks.slice(0, 3).map(cb => cb.code).join('\n---\n'),
      playgroundIds: metadata.playgroundIds.join(', '),
      lastModified: metadata.lastModified.toISOString(),
      vector,
    };
  }

  private createEmbeddingText(metadata: DocumentMetadata): string {
    // Combine key fields for embedding - prioritize title, description, keywords
    const parts = [
      metadata.title,
      metadata.description,
      metadata.keywords.join(' '),
      metadata.headings.slice(0, 5).map(h => h.text).join(' '),
      this.truncateContent(metadata.content, 500),
    ];
    return parts.filter(Boolean).join(' ');
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

  private async findMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await this.findMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private generateDocId(filePath: string, source: DocumentSource): string {
    const basePath = source.path;
    const relativePath = filePath
      .replace(new RegExp(`^.*${basePath.replace(/\//g, '\\/')}\\/`), '')
      .replace(/\.md$/i, '')
      .replace(/\//g, '_');
    return `${source.name}_${relativePath}`;
  }

  private generateDocUrl(metadata: DocumentMetadata, source: DocumentSource): string {
    const basePath = source.path;
    const relativePath = metadata.filePath
      .replace(new RegExp(`^.*${basePath.replace(/\//g, '\\/')}\\/`), '')
      .replace(/\.md$/i, '');

    // For source-repo, use GitHub URL; for documentation, use doc site
    if (source.name === 'source-repo') {
      return `https://github.com/BabylonJS/Babylon.js/blob/master/${relativePath}.md`;
    }

    return `${source.urlPrefix}/${relativePath}`;
  }

  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  async close(): Promise<void> {
    // LanceDB doesn't require explicit closing
    console.log('Indexer closed');
  }
}

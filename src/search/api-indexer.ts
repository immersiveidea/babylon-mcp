import { connect } from '@lancedb/lancedb';
import { pipeline } from '@xenova/transformers';
import type { ApiDocumentation } from './types.js';
import { TSDocExtractor } from './tsdoc-extractor.js';

export interface EmbeddedApiDoc {
  id: string;
  name: string;
  fullName: string;
  kind: string;
  summary: string;
  description: string;
  examples: string;
  parameters: string;
  returns: string;
  type: string;
  deprecated: string;
  see: string;
  since: string;
  sourceFile: string;
  sourceLine: number;
  category: string;
  url: string;
  vector: number[];
}

export class ApiIndexer {
  private db: any;
  private embedder: any;
  private readonly dbPath: string;
  private readonly tableName: string;
  private readonly entryPoints: string[];
  private readonly tsConfigPath?: string | undefined;

  constructor(
    dbPath: string = './data/lancedb',
    tableName: string = 'babylon_api',
    entryPoints: string[] = [],
    tsConfigPath?: string | undefined
  ) {
    this.dbPath = dbPath;
    this.tableName = tableName;
    this.entryPoints = entryPoints;
    this.tsConfigPath = tsConfigPath;
  }

  async initialize(): Promise<void> {
    console.log('Initializing LanceDB connection...');
    this.db = await connect(this.dbPath);

    console.log('Loading embedding model...');
    this.embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('Embedding model loaded');
  }

  async indexApi(): Promise<void> {
    if (!this.embedder) {
      throw new Error('Indexer not initialized. Call initialize() first.');
    }

    // Extract API documentation using TypeDoc
    console.log('Extracting API documentation with TypeDoc...');
    const extractor = new TSDocExtractor();
    const config: any = {
      entryPoints: this.entryPoints,
      includePrivate: false,
    };

    // Only include tsConfigPath if it's defined to satisfy exactOptionalPropertyTypes
    if (this.tsConfigPath !== undefined) {
      config.tsConfigPath = this.tsConfigPath;
    }

    await extractor.initialize(config);

    const apiDocs = await extractor.extract();
    console.log(`Extracted ${apiDocs.length} API documentation entries`);

    // Convert to embedded documents
    console.log('Converting to embedded documents...');
    const embeddedDocs: EmbeddedApiDoc[] = [];

    for (let i = 0; i < apiDocs.length; i++) {
      const doc = apiDocs[i];
      if (!doc) continue;

      try {
        const embedded = await this.processApiDoc(doc);
        embeddedDocs.push(embedded);

        if ((i + 1) % 100 === 0) {
          console.log(`Processed ${i + 1}/${apiDocs.length} API docs`);
        }
      } catch (error) {
        console.error(`Error processing ${doc.fullName}:`, error);
      }
    }

    console.log(`\nTotal API docs embedded: ${embeddedDocs.length}`);
    console.log('Creating LanceDB table...');

    // Drop existing table if it exists
    const tableNames = await this.db.tableNames();
    if (tableNames.includes(this.tableName)) {
      await this.db.dropTable(this.tableName);
    }

    // Create new table with embedded documents
    await this.db.createTable(this.tableName, embeddedDocs);
    console.log('API indexing complete!');
  }

  private async processApiDoc(doc: ApiDocumentation): Promise<EmbeddedApiDoc> {
    const embeddingText = this.createEmbeddingText(doc);
    const vector = await this.generateEmbedding(embeddingText);

    // Generate URL - point to GitHub source
    const url = this.generateGitHubUrl(doc.sourceFile, doc.sourceLine);

    // Determine category from kind
    const category = this.determineCategory(doc);

    return {
      id: this.generateDocId(doc.fullName, doc.kind),
      name: doc.name,
      fullName: doc.fullName,
      kind: doc.kind,
      summary: doc.summary,
      description: doc.description,
      examples: doc.examples.join('\n\n---\n\n'),
      parameters: JSON.stringify(doc.parameters),
      returns: doc.returns ? JSON.stringify(doc.returns) : '',
      type: doc.type || '',
      deprecated: doc.deprecated || '',
      see: doc.see.join(', '),
      since: doc.since || '',
      sourceFile: doc.sourceFile,
      sourceLine: doc.sourceLine,
      category,
      url,
      vector,
    };
  }

  private createEmbeddingText(doc: ApiDocumentation): string {
    // Combine key fields for embedding - prioritize name, summary, parameters
    const parts = [
      doc.fullName,
      doc.kind,
      doc.summary,
      doc.description.substring(0, 500),
      doc.parameters.map(p => `${p.name}: ${p.type}`).join(', '),
      doc.returns ? `returns ${doc.returns.type}` : '',
      doc.examples.slice(0, 1).join(' '),
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

  private generateDocId(fullName: string, kind: string): string {
    return `api_${kind}_${fullName.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  private generateGitHubUrl(sourceFile: string, sourceLine: number): string {
    // Convert local path to GitHub URL
    const relativePath = sourceFile.replace(/^.*\/packages\//, 'packages/');
    return `https://github.com/BabylonJS/Babylon.js/blob/master/${relativePath}#L${sourceLine}`;
  }

  private determineCategory(doc: ApiDocumentation): string {
    // Extract category from source file path
    const match = doc.sourceFile.match(/packages\/dev\/([^/]+)\//);
    if (match && match[1]) {
      return `api/${match[1]}`;
    }
    return `api/${doc.kind.toLowerCase()}`;
  }

  async close(): Promise<void> {
    console.log('API indexer closed');
  }
}

import { connect } from '@lancedb/lancedb';
import { pipeline } from '@xenova/transformers';
import fs from 'fs/promises';
import path from 'path';

export interface SourceCodeChunk {
  id: string;
  filePath: string;
  package: string;
  content: string;
  startLine: number;
  endLine: number;
  language: string;
  imports: string;
  exports: string;
  url: string;
  vector: number[];
}

export class SourceCodeIndexer {
  private db: any;
  private embedder: any;
  private readonly dbPath: string;
  private readonly tableName: string;
  private readonly repositoryPath: string;
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  constructor(
    dbPath: string = './data/lancedb',
    tableName: string = 'babylon_source_code',
    repositoryPath: string = './data/repositories/Babylon.js',
    chunkSize: number = 200,
    chunkOverlap: number = 20
  ) {
    this.dbPath = dbPath;
    this.tableName = tableName;
    this.repositoryPath = repositoryPath;
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
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

  async indexSourceCode(packages: string[] = ['core']): Promise<void> {
    if (!this.embedder) {
      throw new Error('Indexer not initialized. Call initialize() first.');
    }

    const chunks: SourceCodeChunk[] = [];
    let fileCount = 0;

    for (const pkg of packages) {
      console.log(`\nIndexing package: ${pkg}...`);
      const packagePath = path.join(this.repositoryPath, 'packages/dev', pkg, 'src');

      try {
        const files = await this.getAllSourceFiles(packagePath);
        console.log(`Found ${files.length} source files in ${pkg}`);

        for (const file of files) {
          try {
            const fileChunks = await this.processFile(file, pkg);
            chunks.push(...fileChunks);
            fileCount++;

            if (fileCount % 50 === 0) {
              console.log(`Processed ${fileCount}/${files.length} files...`);
            }
          } catch (error) {
            console.error(`Error processing ${file}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error indexing package ${pkg}:`, error);
      }
    }

    console.log(`\nTotal source code chunks: ${chunks.length}`);
    console.log('Creating LanceDB table...');

    // Drop existing table if it exists
    const tableNames = await this.db.tableNames();
    if (tableNames.includes(this.tableName)) {
      await this.db.dropTable(this.tableName);
    }

    // Create new table
    await this.db.createTable(this.tableName, chunks);
    console.log('Source code indexing complete!');
  }

  private async getAllSourceFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules, dist, build, etc.
          if (!['node_modules', 'dist', 'build', 'lib', '.git'].includes(entry.name)) {
            const subFiles = await this.getAllSourceFiles(fullPath);
            files.push(...subFiles);
          }
        } else if (entry.isFile()) {
          // Include .ts, .tsx, .js, .jsx files
          if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
      return [];
    }

    return files;
  }

  private async processFile(filePath: string, pkg: string): Promise<SourceCodeChunk[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const chunks: SourceCodeChunk[] = [];

    // Extract imports and exports for metadata
    const imports = this.extractImports(content);
    const exports = this.extractExports(content);

    // Determine language
    const language = filePath.endsWith('.ts') || filePath.endsWith('.tsx') ? 'typescript' : 'javascript';

    // Get relative path from repository root
    const relativePath = path.relative(this.repositoryPath, filePath);

    // Chunk the file
    for (let i = 0; i < lines.length; i += this.chunkSize - this.chunkOverlap) {
      const startLine = i + 1;
      const endLine = Math.min(i + this.chunkSize, lines.length);
      const chunkLines = lines.slice(i, endLine);
      const chunkContent = chunkLines.join('\n');

      // Skip empty chunks
      if (chunkContent.trim().length === 0) {
        continue;
      }

      // Create embedding
      const embeddingText = this.createEmbeddingText(chunkContent, relativePath);
      const vector = await this.generateEmbedding(embeddingText);

      chunks.push({
        id: `${relativePath}:${startLine}-${endLine}`,
        filePath: relativePath,
        package: pkg,
        content: chunkContent,
        startLine,
        endLine,
        language,
        imports,
        exports,
        url: this.generateGitHubUrl(relativePath, startLine, endLine),
        vector,
      });
    }

    return chunks;
  }

  private extractImports(content: string): string {
    const imports: string[] = [];
    const importRegex = /import\s+(?:{[^}]+}|[^;]+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        imports.push(match[1]);
      }
    }

    return imports.slice(0, 20).join(', '); // Limit to first 20 imports
  }

  private extractExports(content: string): string {
    const exports: string[] = [];
    const exportRegex = /export\s+(?:class|function|interface|type|const|let|var|enum|default)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
    let match;

    while ((match = exportRegex.exec(content)) !== null) {
      if (match[1]) {
        exports.push(match[1]);
      }
    }

    return exports.slice(0, 20).join(', '); // Limit to first 20 exports
  }

  private createEmbeddingText(code: string, filePath: string): string {
    // Combine file path, code, and extract key terms for better search
    const fileName = path.basename(filePath);
    const dirName = path.dirname(filePath).split('/').pop() || '';

    // Extract comments for context
    const comments = this.extractComments(code);

    return `${fileName} ${dirName} ${comments} ${code.substring(0, 1000)}`;
  }

  private extractComments(code: string): string {
    const comments: string[] = [];

    // Single-line comments
    const singleLineRegex = /\/\/\s*(.+)$/gm;
    let match;
    while ((match = singleLineRegex.exec(code)) !== null) {
      if (match[1]) {
        comments.push(match[1].trim());
      }
    }

    // Multi-line comments
    const multiLineRegex = /\/\*\*?([\s\S]*?)\*\//g;
    while ((match = multiLineRegex.exec(code)) !== null) {
      if (match[1]) {
        comments.push(match[1].trim());
      }
    }

    return comments.slice(0, 5).join(' ');
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

  private generateGitHubUrl(relativePath: string, startLine: number, endLine: number): string {
    return `https://github.com/BabylonJS/Babylon.js/blob/master/${relativePath}#L${startLine}-L${endLine}`;
  }

  async close(): Promise<void> {
    console.log('Source code indexer closed');
  }
}

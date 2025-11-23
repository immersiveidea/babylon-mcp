export interface DocumentMetadata {
  filePath: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  breadcrumbs: string[];
  content: string;
  headings: Heading[];
  codeBlocks: CodeBlock[];
  furtherReading: RelatedLink[];
  playgroundIds: string[];
  lastModified: Date;
}

export interface Heading {
  level: number;
  text: string;
  id: string;
}

export interface CodeBlock {
  language: string;
  code: string;
  lineStart: number;
}

export interface RelatedLink {
  title: string;
  url: string;
}

export interface SearchOptions {
  limit?: number;
  category?: string;
  queryType?: 'keyword' | 'semantic' | 'hybrid';
}

export interface SearchResult {
  title: string;
  description: string;
  content: string;
  url: string;
  category: string;
  score: number;
  keywords: string[];
}

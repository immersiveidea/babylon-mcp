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

export interface ApiDocumentation {
  name: string;
  fullName: string;
  kind: string;
  summary: string;
  description: string;
  examples: string[];
  parameters: ApiParameter[];
  returns?: ApiReturn | undefined;
  type?: string | undefined;
  deprecated?: string | undefined;
  see: string[];
  since?: string | undefined;
  sourceFile: string;
  sourceLine: number;
}

export interface ApiParameter {
  name: string;
  type: string;
  description: string;
  optional: boolean;
}

export interface ApiReturn {
  type: string;
  description: string;
}

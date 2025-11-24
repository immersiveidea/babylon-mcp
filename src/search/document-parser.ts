import matter from 'gray-matter';
import fs from 'fs/promises';
import path from 'path';
import type { DocumentMetadata, Heading, CodeBlock } from './types.js';
import { TsxParser } from './tsx-parser.js';

export class DocumentParser {
  private tsxParser: TsxParser;

  constructor() {
    this.tsxParser = new TsxParser();
  }

  async parseFile(filePath: string, urlPrefix?: string): Promise<DocumentMetadata> {
    const ext = path.extname(filePath).toLowerCase();

    // Route to TSX parser for .tsx files
    if (ext === '.tsx') {
      return this.tsxParser.parseFile(filePath, urlPrefix || '');
    }

    // Default markdown parsing for .md files
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: markdown } = matter(content);

    return {
      filePath,
      title: data.title || '',
      description: data.description || '',
      keywords: this.parseKeywords(data.keywords),
      category: this.extractCategory(filePath),
      breadcrumbs: this.extractBreadcrumbs(filePath),
      content: markdown,
      headings: this.extractHeadings(markdown),
      codeBlocks: this.extractCodeBlocks(markdown),
      furtherReading: data['further-reading'] || [],
      playgroundIds: this.extractPlaygroundIds(markdown),
      lastModified: await this.getFileModifiedDate(filePath),
    };
  }

  private parseKeywords(keywords: string | undefined): string[] {
    if (!keywords) return [];
    return keywords.split(',').map((k) => k.trim()).filter(Boolean);
  }

  private extractCategory(filePath: string): string {
    const match = filePath.match(/content\/([^/]+(?:\/[^/]+)*)/);
    if (!match || !match[1]) return 'uncategorized';

    // Remove .md extension if present
    return match[1].replace(/\.md$/, '');
  }

  private extractBreadcrumbs(filePath: string): string[] {
    const category = this.extractCategory(filePath);
    return category.split('/').filter(Boolean);
  }

  private extractHeadings(markdown: string): Heading[] {
    const headings: Heading[] = [];
    const lines = markdown.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      const match = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (match && match[1] && match[2]) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        headings.push({ level, text, id });
      }
    }

    return headings;
  }

  private extractCodeBlocks(markdown: string): CodeBlock[] {
    const codeBlocks: CodeBlock[] = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(markdown)) !== null) {
      if (match.index !== undefined && match[2] !== undefined) {
        const lineStart = markdown.substring(0, match.index).split('\n').length;
        codeBlocks.push({
          language: match[1] || 'plaintext',
          code: match[2].trim(),
          lineStart,
        });
      }
    }

    return codeBlocks;
  }

  private extractPlaygroundIds(markdown: string): string[] {
    const ids: string[] = [];
    const regex = /<Playground\s+id=["']#([^"']+)["']/g;
    let match;

    while ((match = regex.exec(markdown)) !== null) {
      if (match[1]) {
        ids.push(match[1]);
      }
    }

    return ids;
  }

  private async getFileModifiedDate(filePath: string): Promise<Date> {
    const stats = await fs.stat(filePath);
    return stats.mtime;
  }
}

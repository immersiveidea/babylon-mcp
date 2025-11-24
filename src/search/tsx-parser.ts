import fs from 'fs/promises';
import path from 'path';
import * as ts from 'typescript';
import type { DocumentMetadata, Heading, CodeBlock } from './types.js';

/**
 * Parser for extracting documentation content from Next.js/React TSX files.
 * Uses TypeScript Compiler API to accurately parse TSX and extract content.
 * Used specifically for Babylon.js Editor documentation which is embedded in page.tsx files.
 */
export class TsxParser {
  /**
   * Parse a TSX file and extract documentation content
   */
  async parseFile(filePath: string, urlPrefix: string): Promise<DocumentMetadata> {
    const content = await fs.readFile(filePath, 'utf-8');

    // Parse TSX file to AST using TypeScript Compiler API
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    // Extract all text content from JSX elements
    const textContent = this.extractTextFromAST(sourceFile);

    // Extract headings from JSX
    const headings = this.extractHeadingsFromAST(sourceFile);

    // Extract title from first major heading or filename
    const title = headings.length > 0 && headings[0]?.level === 1
      ? headings[0].text
      : this.extractTitleFromPath(filePath);

    // Extract code blocks
    const codeBlocks = this.extractCodeBlocksFromAST(sourceFile, content);

    // Generate category from file path
    const category = this.extractCategory(filePath);
    const breadcrumbs = this.extractBreadcrumbs(filePath);

    // Get last modified date
    const lastModified = await this.getFileModifiedDate(filePath);

    return {
      filePath,
      title,
      description: this.generateDescription(textContent),
      keywords: this.extractKeywords(textContent),
      category,
      breadcrumbs,
      content: textContent,
      headings,
      codeBlocks,
      furtherReading: [],
      playgroundIds: [],
      lastModified,
    };
  }

  /**
   * Extract all text content from JSX elements using AST traversal
   */
  private extractTextFromAST(sourceFile: ts.SourceFile): string {
    const texts: string[] = [];

    const visit = (node: ts.Node) => {
      // Skip JSX attributes to avoid extracting className values
      if (ts.isJsxAttribute(node)) {
        return;
      }

      // Extract text from JSX text nodes (actual content between tags)
      if (ts.isJsxText(node)) {
        const text = node.text.trim();
        // Filter out className values and other non-content
        if (text.length > 0 && !this.isClassNameOrStyle(text)) {
          texts.push(text);
        }
      }

      // Recursively visit all child nodes
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return texts.join('\n\n');
  }

  /**
   * Check if text looks like a className value or style attribute
   */
  private isClassNameOrStyle(text: string): boolean {
    // Filter out className values (contain common Tailwind/CSS patterns)
    if (/^[\w\s-]+:/.test(text)) return true; // CSS-like syntax
    if (/\bflex\b|\bgrid\b|\btext-\w+|\bbg-\w+|\bp-\d+|\bm-\d+/.test(text)) return true; // Tailwind classes
    if (text.split(' ').every(word => /^[\w-]+$/.test(word))) {
      // All words are CSS class-like (no spaces, only alphanumeric and dashes)
      return text.split(' ').length > 3;
    }
    return false;
  }

  /**
   * Extract headings from JSX elements with text-*xl className patterns
   */
  private extractHeadingsFromAST(sourceFile: ts.SourceFile): Heading[] {
    const headings: Heading[] = [];

    const visit = (node: ts.Node) => {
      // Look for JSX elements with className containing text-*xl
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        const className = this.getJsxAttribute(node, 'className');

        if (className) {
          // Check if className contains text-*xl pattern
          const sizeMatch = className.match(/text-([2-6])xl/);
          if (sizeMatch?.[1]) {
            const text = this.extractTextFromNode(node);
            if (text) {
              const sizeToLevel: { [key: string]: number } = {
                '6': 1, '5': 1, '4': 2, '3': 2, '2': 3
              };

              const level = sizeToLevel[sizeMatch[1]] || 3;
              const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

              headings.push({ level, text, id });
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return headings;
  }

  /**
   * Extract code blocks from CodeBlock components and template literals
   */
  private extractCodeBlocksFromAST(sourceFile: ts.SourceFile, content: string): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const codeVariables = new Map<string, string>();

    const visit = (node: ts.Node) => {
      // Find variable declarations with template literals (code blocks)
      if (ts.isVariableDeclaration(node) && node.initializer) {
        if (ts.isNoSubstitutionTemplateLiteral(node.initializer) ||
            ts.isTemplateExpression(node.initializer)) {
          const varName = node.name.getText(sourceFile);
          const code = this.getTemplateLiteralText(node.initializer, sourceFile);
          if (code && this.looksLikeCode(code)) {
            codeVariables.set(varName, code);
          }
        }
      }

      // Find CodeBlock JSX elements
      if ((ts.isJsxSelfClosingElement(node) || ts.isJsxElement(node))) {
        const tagName = this.getJsxTagName(node);
        if (tagName === 'CodeBlock') {
          const codeAttr = this.getJsxAttribute(node, 'code');
          if (codeAttr && codeVariables.has(codeAttr)) {
            const code = codeVariables.get(codeAttr)!;
            blocks.push({
              language: this.detectLanguage(code),
              code: code.trim(),
              lineStart: 0,
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return blocks;
  }

  /**
   * Get JSX attribute value as string
   */
  private getJsxAttribute(node: ts.JsxElement | ts.JsxSelfClosingElement, attributeName: string): string | null {
    const attributes = ts.isJsxElement(node)
      ? node.openingElement.attributes
      : node.attributes;

    for (const attr of attributes.properties) {
      if (ts.isJsxAttribute(attr) && attr.name.getText() === attributeName) {
        if (attr.initializer) {
          if (ts.isStringLiteral(attr.initializer)) {
            return attr.initializer.text;
          }
          if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
            return attr.initializer.expression.getText();
          }
        }
      }
    }
    return null;
  }

  /**
   * Get JSX tag name
   */
  private getJsxTagName(node: ts.JsxElement | ts.JsxSelfClosingElement): string {
    const tagNameNode = ts.isJsxElement(node)
      ? node.openingElement.tagName
      : node.tagName;
    return tagNameNode.getText();
  }

  /**
   * Extract text content from a JSX node (excluding attributes)
   */
  private extractTextFromNode(node: ts.Node): string {
    const texts: string[] = [];

    const visit = (n: ts.Node, inAttribute: boolean = false) => {
      // Skip JSX attributes to avoid getting className values
      if (ts.isJsxAttribute(n)) {
        return; // Don't traverse into attributes
      }

      if (ts.isJsxText(n) && !inAttribute) {
        const text = n.text.trim();
        if (text) texts.push(text);
      }

      ts.forEachChild(n, (child) => visit(child, inAttribute));
    };

    // For JSX elements, only visit the children (not the opening/closing tags with attributes)
    if (ts.isJsxElement(node)) {
      node.children.forEach(child => visit(child));
    } else {
      visit(node);
    }

    return texts.join(' ').trim();
  }

  /**
   * Get text from template literal
   */
  private getTemplateLiteralText(node: ts.TemplateLiteral, sourceFile: ts.SourceFile): string {
    if (ts.isNoSubstitutionTemplateLiteral(node)) {
      return node.text;
    }
    // For template expressions, get the full text
    return node.getText(sourceFile).slice(1, -1); // Remove backticks
  }

  /**
   * Extract title from file path
   */
  private extractTitleFromPath(filePath: string): string {
    const dirName = path.basename(path.dirname(filePath));
    if (dirName !== 'documentation') {
      return this.titleCase(dirName.replace(/-/g, ' '));
    }
    return 'Editor Documentation';
  }

  /**
   * Extract category from file path
   */
  private extractCategory(filePath: string): string {
    // Extract path between "documentation/" and "/page.tsx"
    const match = filePath.match(/documentation\/(.+?)\/page\.tsx/);
    if (match?.[1]) {
      return `editor/${match[1]}`;
    }

    // If it's documentation/page.tsx (root), just use "editor"
    if (filePath.includes('documentation/page.tsx')) {
      return 'editor';
    }

    return 'editor/uncategorized';
  }

  /**
   * Extract breadcrumbs from file path
   */
  private extractBreadcrumbs(filePath: string): string[] {
    const category = this.extractCategory(filePath);
    return category.split('/').filter(Boolean);
  }

  /**
   * Generate a description from the first few sentences of content
   */
  private generateDescription(content: string): string {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const description = sentences.slice(0, 2).join('. ').trim();
    return description.length > 200 ? description.substring(0, 197) + '...' : description;
  }

  /**
   * Extract keywords from content (simple frequency-based approach)
   */
  private extractKeywords(content: string): string[] {
    const commonWords = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their']);

    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4 && !commonWords.has(w));

    // Count frequency
    const freq: { [key: string]: number } = {};
    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1;
    }

    // Get top 10 most frequent
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Clean text by removing extra whitespace and decoding HTML entities
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
  }

  /**
   * Check if text looks like code or import statement
   */
  private isCodeOrImport(text: string): boolean {
    return /^(import|export|const|let|var|function|class|interface|type)\s/.test(text.trim()) ||
           /^[A-Z][a-zA-Z]+Component$/.test(text.trim());
  }

  /**
   * Check if text looks like code
   */
  private looksLikeCode(text: string): boolean {
    // Has typical code patterns: brackets, semicolons, function keywords
    return /[{};()=>]/.test(text) && text.split('\n').length > 2;
  }

  /**
   * Detect programming language from code content
   */
  private detectLanguage(code: string): string {
    if (/import.*from|export|const|let|interface|type/.test(code)) {
      return 'typescript';
    }
    if (/function|var|const|=&gt;/.test(code)) {
      return 'javascript';
    }
    if (/<[a-zA-Z].*>/.test(code)) {
      return 'jsx';
    }
    return 'typescript';
  }

  /**
   * Convert kebab-case to Title Case
   */
  private titleCase(str: string): string {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get file modified date
   */
  private async getFileModifiedDate(filePath: string): Promise<Date> {
    const stats = await fs.stat(filePath);
    return stats.mtime;
  }
}

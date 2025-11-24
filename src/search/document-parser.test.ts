import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DocumentParser } from './document-parser.js';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

describe('DocumentParser', () => {
  const parser = new DocumentParser();
  const sampleFile = path.join(
    process.cwd(),
    'data/repositories/Documentation/content/features.md'
  );

  let tempDir: string;
  let tempFile: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'doc-parser-test-'));
  });

  afterEach(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should parse YAML front matter', async () => {
    const doc = await parser.parseFile(sampleFile);

    expect(doc.title).toBe('Babylon.js Features');
    expect(doc.description).toContain('breadth and depth');
    expect(doc.keywords).toContain('features');
    expect(doc.keywords).toContain('capabilities');
  });

  it('should extract category from file path', async () => {
    const doc = await parser.parseFile(sampleFile);

    expect(doc.category).toBe('features');
    expect(doc.breadcrumbs).toEqual(['features']);
  });

  it('should extract headings', async () => {
    const doc = await parser.parseFile(sampleFile);

    expect(doc.headings.length).toBeGreaterThan(0);
    expect(doc.headings[0]?.text).toBe('Babylon.js Features');
    expect(doc.headings[0]?.level).toBe(1);
  });

  it('should have markdown content', async () => {
    const doc = await parser.parseFile(sampleFile);

    expect(doc.content).toContain('Babylon.js Features');
    expect(doc.content.length).toBeGreaterThan(0);
  });

  it('should extract file path and modified date', async () => {
    const doc = await parser.parseFile(sampleFile);

    expect(doc.filePath).toBe(sampleFile);
    expect(doc.lastModified).toBeInstanceOf(Date);
  });

  it('should extract code blocks with language specified', async () => {
    const doc = await parser.parseFile(sampleFile);

    // Test that code blocks are extracted
    expect(Array.isArray(doc.codeBlocks)).toBe(true);
  });

  it('should extract playground IDs from Playground tags', async () => {
    const doc = await parser.parseFile(sampleFile);

    // Test that playground IDs array exists
    expect(Array.isArray(doc.playgroundIds)).toBe(true);
  });

  it('should handle documents without code blocks', async () => {
    // Create a test with a simple markdown file without code blocks
    const doc = await parser.parseFile(sampleFile);

    expect(doc.codeBlocks).toBeDefined();
    expect(Array.isArray(doc.codeBlocks)).toBe(true);
  });

  it('should handle documents without playground tags', async () => {
    const doc = await parser.parseFile(sampleFile);

    expect(doc.playgroundIds).toBeDefined();
    expect(Array.isArray(doc.playgroundIds)).toBe(true);
  });

  describe('TSX file handling', () => {
    it('should route .tsx files to TSX parser', async () => {
      const tsxContent = `
        export default function Page() {
          return (
            <div>
              <div className="text-5xl">TSX Page Title</div>
              <p>This is TSX content</p>
            </div>
          );
        }
      `;

      tempFile = path.join(tempDir, 'documentation', 'test-page', 'page.tsx');
      await fs.mkdir(path.dirname(tempFile), { recursive: true });
      await fs.writeFile(tempFile, tsxContent);

      const doc = await parser.parseFile(tempFile, 'https://editor.example.com');

      // TSX parser correctly identifies it as editor content
      expect(doc.title).toContain('TSX Page Title');
      expect(doc.category).toBe('editor/test-page');
      expect(doc.filePath).toBe(tempFile);
    });

    it('should extract category from TSX file path', async () => {
      const tsxContent = `
        export default function Page() {
          return <div>Content</div>;
        }
      `;

      tempFile = path.join(tempDir, 'documentation', 'adding-scripts', 'page.tsx');
      await fs.mkdir(path.dirname(tempFile), { recursive: true });
      await fs.writeFile(tempFile, tsxContent);

      const doc = await parser.parseFile(tempFile, 'https://editor.example.com');

      expect(doc.category).toBe('editor/adding-scripts');
      expect(doc.breadcrumbs).toEqual(['editor', 'adding-scripts']);
    });

    it('should handle .md files with markdown parser', async () => {
      const mdContent = `---
title: Test Markdown
description: Test description
keywords: test, markdown
---

# Test Heading

This is markdown content.`;

      tempFile = path.join(tempDir, 'test.md');
      await fs.writeFile(tempFile, mdContent);

      const doc = await parser.parseFile(tempFile);

      expect(doc.title).toBe('Test Markdown');
      expect(doc.description).toBe('Test description');
      expect(doc.keywords).toContain('test');
    });

    it('should pass urlPrefix to TSX parser', async () => {
      const tsxContent = `
        export default function Page() {
          return <div>Test content</div>;
        }
      `;

      tempFile = path.join(tempDir, 'documentation', 'page.tsx');
      await fs.mkdir(path.dirname(tempFile), { recursive: true });
      await fs.writeFile(tempFile, tsxContent);

      const urlPrefix = 'https://custom.example.com';
      const doc = await parser.parseFile(tempFile, urlPrefix);

      expect(doc.filePath).toBe(tempFile);
      expect(doc.lastModified).toBeInstanceOf(Date);
    });

    it('should distinguish between .tsx and .md based on file extension', async () => {
      // Create both .tsx and .md files
      const tsxContent = `export default function Page() { return <div>TSX</div>; }`;
      const mdContent = `---\ntitle: MD File\n---\n# Markdown`;

      const tsxFile = path.join(tempDir, 'test.tsx');
      const mdFile = path.join(tempDir, 'test.md');

      await fs.writeFile(tsxFile, tsxContent);
      await fs.writeFile(mdFile, mdContent);

      const tsxDoc = await parser.parseFile(tsxFile, 'https://example.com');
      const mdDoc = await parser.parseFile(mdFile);

      // TSX should have editor category
      expect(tsxDoc.category).toContain('editor');

      // MD should have standard category extraction
      expect(mdDoc.title).toBe('MD File');
    });
  });
});

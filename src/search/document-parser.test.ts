import { describe, it, expect } from 'vitest';
import { DocumentParser } from './document-parser.js';
import path from 'path';

describe('DocumentParser', () => {
  const parser = new DocumentParser();
  const sampleFile = path.join(
    process.cwd(),
    'data/repositories/Documentation/content/features.md'
  );

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
});

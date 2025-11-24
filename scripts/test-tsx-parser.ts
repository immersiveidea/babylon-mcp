#!/usr/bin/env tsx

import { TsxParser } from '../src/search/tsx-parser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const projectRoot = path.join(__dirname, '..');
  const parser = new TsxParser();

  // Test file: adding-scripts/page.tsx
  const testFile = path.join(
    projectRoot,
    'data',
    'repositories',
    'Editor',
    'website',
    'src',
    'app',
    'documentation',
    'adding-scripts',
    'page.tsx'
  );

  console.log('Testing TSX Parser');
  console.log('==================\n');
  console.log(`File: ${testFile}\n`);

  try {
    const metadata = await parser.parseFile(testFile, 'https://editor.babylonjs.com/documentation');

    console.log('Parsed Metadata:');
    console.log('----------------');
    console.log(`Title: ${metadata.title}`);
    console.log(`Category: ${metadata.category}`);
    console.log(`Breadcrumbs: ${metadata.breadcrumbs.join(' > ')}`);
    console.log(`Description: ${metadata.description.substring(0, 150)}...`);
    console.log(`Keywords: ${metadata.keywords.slice(0, 5).join(', ')}`);
    console.log(`\nHeadings (${metadata.headings.length}):`);
    metadata.headings.forEach(h => {
      console.log(`  ${'  '.repeat(h.level - 1)}${h.text}`);
    });
    console.log(`\nCode Blocks: ${metadata.codeBlocks.length}`);
    metadata.codeBlocks.forEach((cb, i) => {
      console.log(`  ${i + 1}. ${cb.language} (${cb.code.split('\n').length} lines)`);
    });
    console.log(`\nContent Length: ${metadata.content.length} characters`);
    console.log(`\nFirst 500 characters of content:`);
    console.log('---');
    console.log(metadata.content.substring(0, 500));
    console.log('---');

    console.log('\n✓ TSX parsing successful!');
  } catch (error) {
    console.error('✗ Error parsing TSX file:', error);
    process.exit(1);
  }
}

main();

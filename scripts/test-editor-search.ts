#!/usr/bin/env npx tsx

import { LanceDBSearch } from '../src/search/lancedb-search.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const projectRoot = path.join(__dirname, '..');
  const dbPath = path.join(projectRoot, 'data', 'lancedb');

  console.log('Testing Editor Documentation Search');
  console.log('===================================\n');

  const searcher = new LanceDBSearch(dbPath);
  await searcher.initialize();

  const testQueries = [
    'onStart lifecycle method',
    '@nodeFromScene decorator',
    'attaching scripts to objects',
    'creating project in editor',
    'Editor templates',
  ];

  for (const query of testQueries) {
    console.log(`\nQuery: "${query}"`);
    console.log('---');

    const results = await searcher.search(query, { limit: 3 });

    results.forEach((result, i) => {
      console.log(`${i + 1}. ${result.title}`);
      console.log(`   Source: ${result.source}`);
      console.log(`   Category: ${result.category}`);
      console.log(`   Score: ${result.score.toFixed(4)}`);
      console.log(`   URL: ${result.url}`);
    });
  }

  // LanceDBSearch doesn't have close method
  console.log('\n✓ Search tests completed!');
}

main().catch(console.error);

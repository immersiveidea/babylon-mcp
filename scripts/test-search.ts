#!/usr/bin/env tsx

import { LanceDBSearch } from '../src/search/lancedb-search.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const projectRoot = path.join(__dirname, '..');
  const dbPath = path.join(projectRoot, 'data', 'lancedb');

  console.log('Initializing search...');
  const search = new LanceDBSearch(dbPath);
  await search.initialize();

  console.log('\n=== Testing search for "Vector3" ===\n');
  const results = await search.search('Vector3', { limit: 5 });

  console.log(`Found ${results.length} results:\n`);
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.title}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Relevance: ${(result.score * 100).toFixed(1)}%`);
    console.log(`   Description: ${result.description}`);
    console.log(`   Snippet: ${result.content.substring(0, 150)}...`);
    console.log('');
  });

  console.log('\n=== Testing search for "camera controls" ===\n');
  const cameraResults = await search.search('camera controls', { limit: 3 });

  console.log(`Found ${cameraResults.length} results:\n`);
  cameraResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result.title}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Relevance: ${(result.score * 100).toFixed(1)}%`);
    console.log('');
  });

  await search.close();
}

main().catch(console.error);

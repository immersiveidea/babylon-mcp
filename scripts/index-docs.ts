#!/usr/bin/env tsx

import { LanceDBIndexer, DocumentSource } from '../src/search/lancedb-indexer.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const projectRoot = path.join(__dirname, '..');
  const dbPath = path.join(projectRoot, 'data', 'lancedb');

  // Define documentation sources
  const sources: DocumentSource[] = [
    {
      name: 'documentation',
      path: path.join(projectRoot, 'data', 'repositories', 'Documentation', 'content'),
      urlPrefix: 'https://doc.babylonjs.com',
    },
    {
      name: 'source-repo',
      path: path.join(projectRoot, 'data', 'repositories', 'Babylon.js'),
      urlPrefix: 'https://github.com/BabylonJS/Babylon.js/blob/master',
    },
  ];

  console.log('Starting Babylon.js documentation indexing...');
  console.log(`Database path: ${dbPath}`);
  console.log(`\nDocumentation sources:`);
  sources.forEach((source, index) => {
    console.log(`  ${index + 1}. ${source.name}: ${source.path}`);
  });
  console.log('');

  const indexer = new LanceDBIndexer(dbPath, sources);

  try {
    await indexer.initialize();
    await indexer.indexDocuments();
    console.log('');
    console.log('✓ Documentation indexing completed successfully!');
  } catch (error) {
    console.error('Error during indexing:', error);
    process.exit(1);
  } finally {
    await indexer.close();
  }
}

main();

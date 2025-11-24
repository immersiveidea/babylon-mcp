#!/usr/bin/env tsx

// MUST set environment variable before any imports that use @xenova/transformers
// This prevents onnxruntime-node from being loaded on Alpine Linux (musl libc)
if (process.env.TRANSFORMERS_BACKEND === 'wasm' || process.env.TRANSFORMERS_BACKEND === 'onnxruntime-web') {
  process.env.ONNXRUNTIME_BACKEND = 'wasm';
}

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
    {
      name: 'editor-docs',
      path: path.join(projectRoot, 'data', 'repositories', 'Editor', 'website', 'src', 'app', 'documentation'),
      urlPrefix: 'https://editor.babylonjs.com/documentation',
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

// MUST set environment variable before any imports that use @xenova/transformers
// This prevents onnxruntime-node from being loaded on Alpine Linux (musl libc)
if (process.env.TRANSFORMERS_BACKEND === 'wasm' || process.env.TRANSFORMERS_BACKEND === 'onnxruntime-web') {
  process.env.ONNXRUNTIME_BACKEND = 'wasm';
}

import { ApiIndexer } from '../src/search/api-indexer.js';
import path from 'path';

async function main() {
  // Define entry points for all Babylon.js packages
  const repositoryPath = path.resolve('./data/repositories/Babylon.js');

  // All packages with public APIs
  const packages = [
    'core',
    'gui',
    'materials',
    'loaders',
    'serializers',
    'inspector',
    'postProcesses',
    'proceduralTextures',
    'addons',
    'smartFilters',
    'smartFilterBlocks',
  ];

  const entryPoints = packages.map(
    pkg => `${repositoryPath}/packages/dev/${pkg}/src/index.ts`
  );

  console.log('Starting API documentation indexing for all Babylon.js packages...');
  console.log(`Indexing ${packages.length} packages:`, packages.join(', '));
  console.log();

  const indexer = new ApiIndexer(
    './data/lancedb',
    'babylon_api',
    entryPoints,
    `${repositoryPath}/tsconfig.json`
  );

  try {
    await indexer.initialize();
    await indexer.indexApi();
    await indexer.close();
    console.log('\n✓ API indexing completed successfully!');
  } catch (error) {
    console.error('Error during API indexing:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);

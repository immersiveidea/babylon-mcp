// MUST set environment variable before any imports that use @xenova/transformers
// This prevents onnxruntime-node from being loaded on Alpine Linux (musl libc)
if (process.env.TRANSFORMERS_BACKEND === 'wasm' || process.env.TRANSFORMERS_BACKEND === 'onnxruntime-web') {
  process.env.ONNXRUNTIME_BACKEND = 'wasm';
}

import { SourceCodeIndexer } from '../src/search/source-code-indexer.js';

async function main() {
  // Define packages to index
  const packages = [
    'core',
    'gui',
    'materials',
    'loaders',
    'serializers',
  ];

  console.log('Starting source code indexing for Babylon.js packages...');
  console.log(`Indexing ${packages.length} packages:`, packages.join(', '));
  console.log();

  const indexer = new SourceCodeIndexer(
    './data/lancedb',
    'babylon_source_code',
    './data/repositories/Babylon.js',
    200, // chunk size (lines)
    20   // chunk overlap (lines)
  );

  try {
    await indexer.initialize();
    await indexer.indexSourceCode(packages);
    await indexer.close();
    console.log('\n✓ Source code indexing completed successfully!');
  } catch (error) {
    console.error('Error during source code indexing:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);

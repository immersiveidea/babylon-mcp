import { ApiIndexer } from '../src/search/api-indexer.js';
import path from 'path';

async function main() {
  // Start with just core package for testing
  const repositoryPath = path.resolve('./data/repositories/Babylon.js');

  // Use the index.ts entry point like Babylon.js does
  const entryPoints = [
    `${repositoryPath}/packages/dev/core/src/index.ts`,
  ];

  console.log('Testing API documentation indexing with a single file...');
  console.log('Entry point:', entryPoints[0]);

  const indexer = new ApiIndexer(
    './data/lancedb',
    'babylon_api_test',
    entryPoints,
    `${repositoryPath}/tsconfig.json`
  );

  try {
    await indexer.initialize();
    await indexer.indexApi();
    await indexer.close();
    console.log('\n✓ Test indexing completed successfully!');
  } catch (error) {
    console.error('Error during test indexing:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);

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

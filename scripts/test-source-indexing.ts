import { SourceCodeIndexer } from '../src/search/source-code-indexer.js';

async function main() {
  // Start with just core package for testing
  const packages = ['core'];

  console.log('Testing source code indexing with core package...');
  console.log();

  const indexer = new SourceCodeIndexer(
    './data/lancedb',
    'babylon_source_test',
    './data/repositories/Babylon.js',
    100, // smaller chunk size for testing
    10   // smaller overlap for testing
  );

  try {
    await indexer.initialize();
    await indexer.indexSourceCode(packages);
    await indexer.close();
    console.log('\n✓ Test source code indexing completed successfully!');
  } catch (error) {
    console.error('Error during test indexing:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);

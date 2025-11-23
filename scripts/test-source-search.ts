import { LanceDBSearch } from '../src/search/lancedb-search.js';

async function main() {
  console.log('Testing source code search...\n');

  // Note: We use babylon_docs as the main table, but specify babylon_source_test for source code search
  const search = new LanceDBSearch('./data/lancedb', 'babylon_docs');
  await search.initialize();

  try {
    // Test 1: Search for getMeshByName implementation
    console.log('='.repeat(80));
    console.log('Test 1: Searching for "getMeshByName implementation"');
    console.log('='.repeat(80));
    const results1 = await search.searchSourceCode('getMeshByName implementation', {
      limit: 3,
      tableName: 'babylon_source_test'
    });
    console.log(`Found ${results1.length} results:\n`);

    for (const result of results1) {
      console.log(`File: ${result.filePath}`);
      console.log(`Lines: ${result.startLine}-${result.endLine}`);
      console.log(`Score: ${(result.score * 100).toFixed(1)}%`);
      console.log(`Preview: ${result.content.substring(0, 200)}...`);
      console.log(`URL: ${result.url}`);
      console.log('-'.repeat(80));
    }

    // Test 2: Get specific source file
    console.log('\n');
    console.log('='.repeat(80));
    console.log('Test 2: Getting source file scene.ts lines 4100-4110');
    console.log('='.repeat(80));
    const sourceCode = await search.getSourceFile('packages/dev/core/src/scene.ts', 4100, 4110);
    if (sourceCode) {
      console.log(sourceCode);
    } else {
      console.log('File not found');
    }

    // Test 3: Search for mesh management
    console.log('\n');
    console.log('='.repeat(80));
    console.log('Test 3: Searching for "mesh management scene"');
    console.log('='.repeat(80));
    const results3 = await search.searchSourceCode('mesh management scene', {
      limit: 2,
      tableName: 'babylon_source_test'
    });
    console.log(`Found ${results3.length} results:\n`);

    for (const result of results3) {
      console.log(`File: ${result.filePath}`);
      console.log(`Lines: ${result.startLine}-${result.endLine}`);
      console.log(`Exports: ${result.exports}`);
      console.log(`Score: ${(result.score * 100).toFixed(1)}%`);
      console.log('-'.repeat(80));
    }

  } catch (error) {
    console.error('Error during search:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }

  await search.close();
}

main().catch(console.error);

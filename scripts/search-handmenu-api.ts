import { LanceDBSearch } from '../src/search/lancedb-search.js';

async function main() {
  console.log('Searching for HandMenu in API documentation...\n');

  const search = new LanceDBSearch('./data/lancedb', 'babylon_docs');
  await search.initialize();

  try {
    const results = await search.searchApi('HandMenu', { limit: 10 });
    console.log(`Found ${results.length} results:\n`);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      console.log('='.repeat(80));
      console.log(`${i + 1}. ${result.fullName} (${result.kind})`);
      console.log('='.repeat(80));

      if (result.summary) {
        console.log(`Summary: ${result.summary}`);
      }

      if (result.description && result.description !== result.summary) {
        console.log(`Description: ${result.description}`);
      }

      if (result.parameters) {
        try {
          const params = JSON.parse(result.parameters);
          if (params.length > 0) {
            console.log(`Parameters:`);
            for (const param of params) {
              console.log(`  - ${param.name}: ${param.type}${param.description ? ' - ' + param.description : ''}`);
            }
          }
        } catch (e) {
          // Skip if parameters can't be parsed
        }
      }

      if (result.returns) {
        try {
          const returns = JSON.parse(result.returns);
          console.log(`Returns: ${returns.type}${returns.description ? ' - ' + returns.description : ''}`);
        } catch (e) {
          // Skip if returns can't be parsed
        }
      }

      console.log(`Relevance: ${(result.score * 100).toFixed(1)}%`);
      console.log(`Source: ${result.sourceFile}:${result.sourceLine}`);
      console.log(`URL: ${result.url}`);
      console.log();
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

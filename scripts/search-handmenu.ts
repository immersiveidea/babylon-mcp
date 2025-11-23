import { LanceDBSearch } from '../src/search/lancedb-search.js';

async function main() {
  console.log('Searching for handMenu API documentation...\n');

  const search = new LanceDBSearch('./data/lancedb', 'babylon_docs');
  await search.initialize();

  try {
    const results = await search.searchApi('handMenu', { limit: 10 });

    console.log(`Found ${results.length} results:\n`);

    for (const result of results) {
      console.log('='.repeat(80));
      console.log(`${result.fullName} (${result.kind})`);
      console.log('='.repeat(80));

      if (result.summary) {
        console.log(`Summary: ${result.summary}`);
      }

      if (result.description) {
        console.log(`Description: ${result.description}`);
      }

      if (result.parameters) {
        const params = JSON.parse(result.parameters);
        if (params.length > 0) {
          console.log(`Parameters: ${params.map((p: any) => `${p.name}: ${p.type}`).join(', ')}`);
        }
      }

      if (result.returns) {
        const returns = JSON.parse(result.returns);
        console.log(`Returns: ${returns.type}`);
      }

      console.log(`Score: ${(result.score * 100).toFixed(1)}%`);
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

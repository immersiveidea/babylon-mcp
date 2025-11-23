import { LanceDBSearch } from '../src/search/lancedb-search.js';

async function main() {
  console.log('Testing API search for "getMeshByName"...\n');

  const search = new LanceDBSearch('./data/lancedb', 'babylon_docs');
  await search.initialize();

  try {
    const results = await search.searchApi('getMeshByName', { limit: 5 });

    console.log(`Found ${results.length} results:\n`);

    for (const result of results) {
      console.log(`Name: ${result.name}`);
      console.log(`Full Name: ${result.fullName}`);
      console.log(`Kind: ${result.kind}`);
      console.log(`Summary: ${result.summary}`);
      console.log(`Score: ${(result.score * 100).toFixed(1)}%`);

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

      console.log(`URL: ${result.url}`);
      console.log('\n---\n');
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

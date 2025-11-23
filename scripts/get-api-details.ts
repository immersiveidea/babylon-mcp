import { LanceDBSearch } from '../src/search/lancedb-search.js';

async function main() {
  console.log('Getting full details for Scene.getMeshByName...\n');

  const search = new LanceDBSearch('./data/lancedb', 'babylon_docs');
  await search.initialize();

  try {
    const results = await search.searchApi('Scene.getMeshByName', { limit: 1 });

    if (results.length === 0) {
      console.log('No results found');
      return;
    }

    const result = results[0];

    console.log('='.repeat(80));
    console.log(`${result.fullName} (${result.kind})`);
    console.log('='.repeat(80));
    console.log();

    if (result.summary) {
      console.log('Summary:');
      console.log(`  ${result.summary}`);
      console.log();
    }

    if (result.description) {
      console.log('Description:');
      console.log(`  ${result.description}`);
      console.log();
    }

    if (result.parameters) {
      const params = JSON.parse(result.parameters);
      if (params.length > 0) {
        console.log('Parameters:');
        for (const param of params) {
          console.log(`  - ${param.name}: ${param.type}`);
          if (param.description) {
            console.log(`    ${param.description}`);
          }
        }
        console.log();
      }
    }

    if (result.returns) {
      const returns = JSON.parse(result.returns);
      console.log('Returns:');
      console.log(`  Type: ${returns.type}`);
      if (returns.description) {
        console.log(`  Description: ${returns.description}`);
      }
      console.log();
    }

    if (result.type) {
      console.log(`Type: ${result.type}`);
      console.log();
    }

    if (result.examples) {
      console.log('Examples:');
      console.log(result.examples);
      console.log();
    }

    if (result.deprecated) {
      console.log(`⚠️  DEPRECATED: ${result.deprecated}`);
      console.log();
    }

    if (result.see) {
      console.log(`See Also: ${result.see}`);
      console.log();
    }

    if (result.since) {
      console.log(`Since: ${result.since}`);
      console.log();
    }

    console.log('Source:');
    console.log(`  File: ${result.sourceFile}`);
    console.log(`  Line: ${result.sourceLine}`);
    console.log(`  URL: ${result.url}`);
    console.log();

    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error getting API details:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }

  await search.close();
}

main().catch(console.error);

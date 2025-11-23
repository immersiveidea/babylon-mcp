#!/usr/bin/env tsx
import { DocumentParser } from '../src/search/document-parser.js';
import path from 'path';

async function main() {
  const parser = new DocumentParser();

  // Test files to parse
  const testFiles = [
    'data/repositories/Documentation/content/features.md',
    'data/repositories/Documentation/content/features/featuresDeepDive/mesh/gizmo.md',
    'data/repositories/Documentation/content/toolsAndResources/thePlayground.md',
  ];

  console.log('🔍 Testing DocumentParser on real BabylonJS documentation\n');
  console.log('='.repeat(80));

  for (const file of testFiles) {
    const filePath = path.join(process.cwd(), file);

    try {
      console.log(`\n📄 Parsing: ${file}`);
      console.log('-'.repeat(80));

      const doc = await parser.parseFile(filePath);

      console.log(`Title: ${doc.title}`);
      console.log(`Description: ${doc.description.substring(0, 100)}...`);
      console.log(`Category: ${doc.category}`);
      console.log(`Breadcrumbs: ${doc.breadcrumbs.join(' > ')}`);
      console.log(`Keywords: ${doc.keywords.join(', ')}`);
      console.log(`Headings: ${doc.headings.length} found`);

      if (doc.headings.length > 0) {
        console.log('  First 3 headings:');
        doc.headings.slice(0, 3).forEach(h => {
          console.log(`    ${'#'.repeat(h.level)} ${h.text}`);
        });
      }

      console.log(`Code blocks: ${doc.codeBlocks.length} found`);
      if (doc.codeBlocks.length > 0) {
        console.log('  Languages:', [...new Set(doc.codeBlocks.map(cb => cb.language))].join(', '));
      }

      console.log(`Playground IDs: ${doc.playgroundIds.length} found`);
      if (doc.playgroundIds.length > 0) {
        console.log('  IDs:', doc.playgroundIds.slice(0, 3).join(', '));
      }

      console.log(`Further reading: ${doc.furtherReading.length} links`);
      if (doc.furtherReading.length > 0) {
        doc.furtherReading.forEach(link => {
          console.log(`  - ${link.title}: ${link.url}`);
        });
      }

      console.log(`Content length: ${doc.content.length} characters`);
      console.log(`Last modified: ${doc.lastModified.toISOString()}`);

    } catch (error) {
      console.error(`❌ Error parsing ${file}:`, error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Parser test complete!');
}

main().catch(console.error);

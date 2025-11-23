#!/usr/bin/env tsx

import { RepositoryManager } from '../src/mcp/repository-manager.js';
import { BABYLON_REPOSITORIES } from '../src/mcp/repository-config.js';

async function main() {
  console.log('Cloning/updating Babylon.js repositories...\n');

  const repoManager = new RepositoryManager();

  for (const repo of BABYLON_REPOSITORIES) {
    try {
      await repoManager.ensureRepository(repo);
      console.log(`✓ ${repo.name} ready\n`);
    } catch (error) {
      console.error(`✗ Failed to setup ${repo.name}:`, error);
      process.exit(1);
    }
  }

  console.log('✓ All repositories ready!');
}

main();

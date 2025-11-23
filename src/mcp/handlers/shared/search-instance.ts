import { LanceDBSearch } from '../../../search/lancedb-search.js';

let searchInstance: LanceDBSearch | null = null;

export async function getSearchInstance(): Promise<LanceDBSearch> {
  if (!searchInstance) {
    searchInstance = new LanceDBSearch();
    await searchInstance.initialize();
  }
  return searchInstance;
}

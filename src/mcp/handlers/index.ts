import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as searchDocsHandler from './docs/search-docs.handler.js';
import * as getDocHandler from './docs/get-doc.handler.js';
import * as searchApiHandler from './api/search-api.handler.js';
import * as searchSourceHandler from './source/search-source.handler.js';
import * as getSourceHandler from './source/get-source.handler.js';

/**
 * Register all MCP tool handlers with the server.
 *
 * This function sets up all 5 Babylon.js MCP tools:
 * - search_babylon_docs: Search documentation
 * - get_babylon_doc: Get specific documentation
 * - search_babylon_api: Search API documentation
 * - search_babylon_source: Search source code
 * - get_babylon_source: Get source code files
 */
export function setupHandlers(server: McpServer): void {
  searchDocsHandler.register(server);
  getDocHandler.register(server);
  searchApiHandler.register(server);
  searchSourceHandler.register(server);
  getSourceHandler.register(server);
}

/**
 * MCP Server Configuration
 * Defines metadata and capabilities for the Babylon MCP Server
 */

export const MCP_SERVER_CONFIG = {
  name: 'babylon-mcp',
  version: '1.0.0',
  description: 'Babylon.js Documentation and Examples MCP Server',
  author: 'Babylon MCP Team',

  capabilities: {
    tools: {
      description: 'Provides tools for searching and retrieving Babylon.js documentation',
      available: ['search_babylon_docs', 'get_babylon_doc'],
    },
    prompts: {
      description: 'Future: Pre-defined prompts for common Babylon.js tasks',
      available: [],
    },
    resources: {
      description: 'Future: Direct access to documentation resources',
      available: [],
    },
  },

  instructions:
    'Babylon MCP Server provides access to Babylon.js documentation, API references, and code examples. ' +
    'Use search_babylon_docs to find relevant documentation, and get_babylon_doc to retrieve specific pages. ' +
    'This server helps reduce token usage by providing a canonical source for Babylon.js framework information.',

  transport: {
    type: 'http',
    protocol: 'StreamableHTTP',
    description: 'HTTP transport with JSON-RPC over HTTP POST (stateless mode)',
    defaultPort: 4000,
    endpoint: '/mcp',
  },

  sources: {
    documentation: {
      repository: 'https://github.com/BabylonJS/Documentation.git',
      description: 'Official Babylon.js documentation repository',
    },
    babylonSource: {
      repository: 'https://github.com/BabylonJS/Babylon.js.git',
      description: 'Babylon.js source code (future integration)',
    },
    havok: {
      repository: 'https://github.com/BabylonJS/havok.git',
      description: 'Havok Physics integration (future)',
    },
  },
} as const;

export type MCPServerConfig = typeof MCP_SERVER_CONFIG;

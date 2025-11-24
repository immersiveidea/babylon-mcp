/**
 * MCP Server Configuration
 * Defines metadata and capabilities for the Babylon MCP Server
 */

export const MCP_SERVER_CONFIG = {
  name: 'babylon-mcp',
  version: '1.1.0',
  description: 'Babylon.js Documentation and Examples MCP Server',
  author: 'Babylon MCP Team',

  capabilities: {
    tools: {
      description:
        'Provides tools for searching and retrieving Babylon.js documentation, API references, source code, and Editor documentation',
      available: [
        'search_babylon_docs',
        'get_babylon_doc',
        'search_babylon_api',
        'search_babylon_source',
        'get_babylon_source',
        'search_babylon_editor_docs',
      ],
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
    'Babylon MCP Server provides access to Babylon.js documentation, API references, source code, and Editor documentation. ' +
    'Available tools:\n' +
    '- search_babylon_docs: Search documentation with optional category filtering\n' +
    '- get_babylon_doc: Retrieve full documentation page by path\n' +
    '- search_babylon_api: Search API documentation (classes, methods, properties)\n' +
    '- search_babylon_source: Search Babylon.js source code files with optional package filtering\n' +
    '- get_babylon_source: Retrieve source file content with optional line range\n' +
    '- search_babylon_editor_docs: Search Babylon.js Editor documentation for tool usage and workflows\n' +
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
      description: 'Babylon.js source code repository',
    },
    havok: {
      repository: 'https://github.com/BabylonJS/havok.git',
      description: 'Havok Physics integration',
    },
    editor: {
      repository: 'https://github.com/BabylonJS/Editor.git',
      description: 'Babylon.js Editor tool and documentation',
    },
  },
} as const;

export type MCPServerConfig = typeof MCP_SERVER_CONFIG;

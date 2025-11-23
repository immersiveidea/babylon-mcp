# Babylon MCP Server

A Model Context Protocol (MCP) server that provides AI agents with access to Babylon.js documentation, API references, and source code through semantic search.

## Overview

The Babylon MCP server enables AI assistants to:
- Search and retrieve Babylon.js documentation
- Query API documentation for classes, methods, and properties
- Search through Babylon.js source code
- Retrieve specific source code files or line ranges

This provides a canonical source for Babylon.js framework information, reducing token usage and improving accuracy when working with AI agents.

## Features

- **Documentation Search**: Semantic search across Babylon.js documentation
- **API Documentation**: Search TypeScript API documentation with full TSDoc details
- **Source Code Search**: Vector-based semantic search through Babylon.js source code
- **Source Code Retrieval**: Fetch specific files or line ranges from the repository
- **Local Repository Management**: Automatically clones and updates Babylon.js repositories

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- ~2GB disk space for repositories and vector database

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd babylon-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Initial Setup

Before using the MCP server, you need to index the Babylon.js repositories. This is a one-time setup process.

### Index All Data (Recommended)

Run the master indexing script to index documentation, API, and source code:

```bash
npm run index:all
```

This will:
1. Clone the required repositories (Documentation, Babylon.js, havok)
2. Index all documentation files (~5-10 minutes)
3. Index API documentation from TypeScript source (~10-15 minutes)
4. Index source code from core packages (~15-20 minutes)

Total indexing time: **30-45 minutes** depending on your system.

### Index Individual Components

You can also index components separately:

```bash
# Index documentation only
npm run index:docs

# Index API documentation only
npm run index:api

# Index source code only
npm run index:source
```

## Running the Server

### Development Mode

Run the server with hot reload:

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server runs on **port 4000** by default.

## Integration with AI Assistants

The Babylon MCP server uses HTTP transport and must be running before connecting AI assistants.

### Starting the Server

First, start the MCP server:

```bash
# Development mode with hot reload
npm run dev

# OR production mode
npm start
```

The server runs on **http://localhost:4000** by default.

### Claude Desktop Configuration

To use this MCP server with Claude Desktop, add it to your Claude configuration file.

#### Configuration File Location

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

#### Configuration

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "babylon-mcp": {
      "url": "http://localhost:4000/mcp"
    }
  }
}
```

#### Restart Claude Desktop

After updating the configuration, restart Claude Desktop for the changes to take effect.

### Claude Code CLI Configuration

To use this MCP server with Claude Code (command line), add it to your Claude Code configuration file.

#### Configuration File Location

- **macOS/Linux**: `~/.claude/config.json`
- **Windows**: `%USERPROFILE%\.claude\config.json`

#### Configuration

Add the following to your `config.json`:

```json
{
  "mcpServers": {
    "babylon-mcp": {
      "url": "http://localhost:4000/mcp"
    }
  }
}
```

#### Usage

After configuration, you can use the `/mcp` command in Claude Code to interact with the server:

```bash
# Connect to the MCP server
/mcp babylon-mcp

# Use the tools
Search for "Vector3" in Babylon.js documentation
```

## Available MCP Tools

Once configured, Claude will have access to these tools:

### 1. search_babylon_docs
Search Babylon.js documentation with semantic search.

**Parameters:**
- `query` (string, required): Search query
- `category` (string, optional): Filter by category (e.g., "api", "tutorial")
- `limit` (number, optional): Maximum results (default: 5)

**Example:**
```
Search for "how to create a mesh" in Babylon.js documentation
```

### 2. get_babylon_doc
Retrieve full content of a specific documentation page.

**Parameters:**
- `path` (string, required): Documentation file path or identifier

**Example:**
```
Get the full documentation for "features/featuresDeepDive/mesh/creation"
```

### 3. search_babylon_api
Search Babylon.js API documentation (classes, methods, properties).

**Parameters:**
- `query` (string, required): API search query (e.g., "getMeshByName", "Scene")
- `limit` (number, optional): Maximum results (default: 5)

**Example:**
```
Search the API for "getMeshByName"
```

### 4. search_babylon_source
Search Babylon.js source code using semantic search.

**Parameters:**
- `query` (string, required): Search query for source code
- `package` (string, optional): Filter by package (e.g., "core", "gui")
- `limit` (number, optional): Maximum results (default: 5)

**Example:**
```
Search the source code for "mesh rendering implementation"
```

### 5. get_babylon_source
Retrieve full source code file or specific line range.

**Parameters:**
- `filePath` (string, required): Relative path from repository root
- `startLine` (number, optional): Start line number (1-indexed)
- `endLine` (number, optional): End line number (1-indexed)

**Example:**
```
Get the source code from "packages/dev/core/src/scene.ts" lines 4100-4110
```

## Project Structure

```
babylon-mcp/
├── src/
│   ├── mcp/              # MCP server implementation
│   │   ├── index.ts      # Server entry point
│   │   ├── server.ts     # BabylonMCPServer class
│   │   ├── handlers.ts   # MCP tool handlers
│   │   └── ...
│   └── search/           # Search and indexing
│       ├── lancedb-search.ts        # Search implementation
│       ├── lancedb-indexer.ts       # Documentation indexer
│       ├── api-indexer.ts           # API indexer
│       ├── source-code-indexer.ts   # Source code indexer
│       └── ...
├── scripts/              # Indexing scripts
│   ├── index-docs.ts     # Index documentation
│   ├── index-api.ts      # Index API docs
│   └── index-source.ts   # Index source code
├── data/                 # Data directory (created during indexing)
│   ├── repositories/     # Cloned repositories
│   └── lancedb/          # Vector database
└── dist/                 # Compiled output
```

## Development

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Type Checking

```bash
npm run typecheck
```

### Building

```bash
npm run build
```

## Data Storage

The server stores data in the `./data` directory:

- **`./data/repositories/`**: Cloned Git repositories (Documentation, Babylon.js, havok)
- **`./data/lancedb/`**: Vector database containing indexed content

This directory will be approximately **1.5-2GB** after full indexing.

## Updating Data

To update the indexed data with the latest Babylon.js content:

1. The repositories are automatically updated during indexing
2. Re-run the indexing scripts:

```bash
npm run index:all
```

## Troubleshooting

### Server won't start
- Ensure port 4000 is available
- Check that the project has been built: `npm run build`
- Verify Node.js version is 18 or higher

### Indexing fails
- Ensure you have internet connectivity (for cloning repositories)
- Check disk space (~2GB required)
- Try indexing components individually to isolate the issue

### Claude doesn't see the tools
- **Ensure the server is running**: `npm run dev` or `npm start`
- **Verify server is accessible**: `curl http://localhost:4000/health` should return `{"status":"healthy"...}`
- **Check configuration**: Ensure `~/.claude/config.json` or Claude Desktop config has the correct URL
- **Restart Claude**: Restart Claude Desktop or Claude Code after configuration changes
- **Check server logs**: Look for connection attempts in the server output

### Search returns no results
- Ensure indexing has completed successfully
- Check that the `./data/lancedb` directory exists and contains data
- Try re-indexing: `npm run index:all`

## Architecture

The server uses:
- **LanceDB**: Vector database for semantic search
- **Xenova/all-MiniLM-L6-v2**: Transformer model for embeddings
- **TypeDoc**: For extracting TypeScript API documentation
- **Express.js**: Web server framework
- **MCP SDK**: Model Context Protocol implementation

## Contributing

Contributions are welcome! Please ensure:
- All tests pass: `npm test`
- Type checking passes: `npm run typecheck`
- Code follows the project style

## License

ISC

## Resources

- [Babylon.js Documentation](https://doc.babylonjs.com/)
- [Babylon.js Repository](https://github.com/BabylonJS/Babylon.js)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Claude Desktop](https://claude.ai/download)

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A TypeScript-based Node.js project using Express.js for building a Babylon MCP server. The project uses ES modules and modern TypeScript standards.
## Goals:
* Enable developers using babylonjs to quickly and easily search most current documentation for api documentation.
* Reduce token usage when using AI agents by having a canonical source for the framework and documentation.
* Enable developers to quickly and easily find sanbox examples
* Provide a mechanism to give feedback on how useful a particular result from the MCP server is for what they're trying to do
* Provide a mechanism to store feedback and use it to boost or lower probability of it being useful
* Provide a mechanism to collect feature enhancements or improvements and store them
* Provide a mechanism for users to see what other people have recommended and vote on the usefulness for them

## Sources of information:
* **Documentation** https://github.com/BabylonJS/Documentation.git
* **Babylon Source** https://github.com/BabylonJS/Babylon.js.git
* **Havok Physics** https://github.com/BabylonJS/havok.git

## Roadmap Progress Tracking
When updating ROADMAP.md to track progress:
* Use `[X]` to mark completed tasks
* Use `[I]` to mark tasks currently in progress
* Use `[ ]` for tasks not yet started

This provides a clear visual indicator of project status.

## Development Commands

### Unified Server (MCP + Web Interface)
- `npm run dev` - Start server in development mode with hot reload (tsx watch)
- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm start` - Run compiled server from dist/

### Build & Testing
- `npm run typecheck` - Run TypeScript type checking without emitting files
- `npm run clean` - Remove the dist/ directory
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run all tests once
- `npm run test:ui` - Run tests with interactive UI
- `npm run test:coverage` - Run tests with coverage report

The server runs on **port 4000** by default and provides both MCP endpoints and web interface.

## Architecture

### Technology Stack
- **Runtime**: Node.js with ES modules
- **Language**: TypeScript 5.9+ with strict mode enabled
- **MCP Server**: @modelcontextprotocol/sdk v1.22+ (StreamableHTTPServerTransport)
- **Web Framework**: Express.js 5.x (integrated with MCP server)
- **Build Tool**: TypeScript compiler (tsc)
- **Dev Tools**: tsx (TypeScript executor with watch mode)
- **Testing**: Vitest 4.x with v8 coverage provider
- **HTTP Testing**: supertest for Express route testing
- **Schema Validation**: Zod v3.23.8 (compatible with MCP SDK)

### TypeScript Configuration
- **Target**: ES2022 with NodeNext module resolution
- **Strict Mode**: All strict checks enabled including:
  - `noUnusedLocals`, `noUnusedParameters`
  - `noUncheckedIndexedAccess`
  - `exactOptionalPropertyTypes`
  - `noImplicitOverride`
- **Module System**: ES modules (`"type": "module"` in package.json)
- **Output**: Compiled files go to `dist/` with source maps and declaration files

### Project Structure
```
src/
  mcp/
    index.ts           - Main server entry point
    server.ts          - BabylonMCPServer class (MCP + Express integrated)
    config.ts          - Server configuration and metadata
    handlers.ts        - MCP tool handlers (search_babylon_docs, get_babylon_doc)
    routes.ts          - Express route definitions (/, /health, /mcp)
    transport.ts       - HTTP transport layer for MCP requests
    *.test.ts          - Co-located unit tests for each module
  __tests__/
    setup.ts           - Global test setup and teardown
    fixtures/          - Test fixtures (mock MCP requests, etc.)
  index.ts             - Re-exports for library usage
dist/                  - Compiled JavaScript output (gitignored)
vitest.config.ts       - Vitest test configuration
```

### MCP Server Architecture

The MCP (Model Context Protocol) server is the primary interface for this application. It provides tools that AI agents can use to search and retrieve Babylon.js documentation.

#### Current MCP Tools
- **search_babylon_docs**: Search Babylon.js documentation
  - Input: `query` (string), optional `category` (string), optional `limit` (number)
  - Output: Ranked documentation results with snippets and links
  - Status: Placeholder implementation

- **get_babylon_doc**: Retrieve full documentation content
  - Input: `path` (string) - documentation file path or identifier
  - Output: Full documentation content optimized for AI consumption
  - Status: Placeholder implementation

#### MCP Server Details
- **Transport**: HTTP with StreamableHTTPServerTransport (stateless mode)
- **Default Port**: 4000
- **Root Endpoint**: `http://localhost:4000/` (GET - server info)
- **MCP Endpoint**: `http://localhost:4000/mcp` (POST - JSON-RPC requests)
- **Health Check**: `http://localhost:4000/health` (GET request)
- **Server Name**: babylon-mcp
- **Version**: 1.0.0
- **Location**: `src/mcp/server.ts`
- **Configuration**: `src/mcp/config.ts`

The server is a unified Express + MCP application. It uses the official MCP SDK with StreamableHTTPServerTransport and implements the standard MCP protocol for tool listing and execution over HTTP POST requests with JSON-RPC.

## Testing Strategy

### Test Framework: Vitest
We use Vitest for unit testing due to its:
- Native ES modules and TypeScript support
- 10-20x faster than Jest
- Compatible API with Jest for easy migration
- Built-in coverage via v8

### Test Organization
- **Co-located tests**: Each source file has a corresponding `.test.ts` file in the same directory
- **AAA Pattern**: Tests follow Arrange-Act-Assert structure
- **Comprehensive mocking**: All external dependencies (MCP SDK, Express, etc.) are properly mocked

### Coverage Targets
- **Lines**: 80% minimum
- **Functions**: 80% minimum
- **Branches**: 75% minimum
- **Statements**: 80% minimum

Current coverage: **100% across all metrics** ✓

### Test Suites
1. **config.test.ts** (19 tests)
   - Server metadata validation
   - Capability definitions
   - Transport configuration
   - Source repository URLs

2. **handlers.test.ts** (18 tests)
   - MCP tool registration
   - search_babylon_docs handler (query, category, limit parameters)
   - get_babylon_doc handler (path parameter)
   - Zod schema validation
   - Response format compliance

3. **routes.test.ts** (12 tests)
   - Express middleware setup
   - Root endpoint (GET /)
   - Health check endpoint (GET /health)
   - MCP endpoint (POST /mcp)
   - 404 handling

4. **transport.test.ts** (9 tests)
   - StreamableHTTPServerTransport creation
   - Server connection lifecycle
   - Request handling
   - Response close listener
   - JSON-RPC error responses

5. **server.test.ts** (15 tests)
   - BabylonMCPServer construction
   - HTTP server startup (default and custom ports)
   - Graceful shutdown
   - SIGINT/SIGTERM signal handling

### Running Tests
```bash
npm test              # Watch mode for development
npm run test:run      # Run once (CI/CD)
npm run test:ui       # Interactive UI
npm run test:coverage # Generate coverage report
```

### Testing Best Practices
- Use TypeScript non-null assertions (`!`) in tests for cleaner code
- Mock external dependencies at module level
- Test both success and error paths
- Verify mock call counts and arguments
- Test edge cases (empty arrays, undefined values, errors)

## Coding Standards
### Naming Conventions
### General Guidance
* Prefer short methods and files.
  * Functions shorter than 20 lines
  * Files smaller than 100 lines
* Prefer using third party libraries if generated code is going to exceed size standards. 
  * Prompt to search npmjs and the internet to see if there are libraries that might meet our needs.
  * Think deeply and advise on tradeoffs for libraries (including popularity, update frequency, and any security vulnerabilityes)
  * Don't use libraries flagged as outdated or no longer maintained
  * Prefer libraries with fewer dependencies over those with many
* when selecting approaches, check documentation for deprecated code and research alternatives or new approaches.
- I'm ok with ! operator in test cases, but only use rarely in runtime code.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import express, { type Request, type Response } from 'express';
import { MCP_SERVER_CONFIG } from './config.js';
import { handleMcpRequest } from './transport.js';

export function setupRoutes(
  app: express.Application,
  server: McpServer
): void {
  setupMiddleware(app);
  registerEndpoints(app, server);
}

function setupMiddleware(app: express.Application): void {
  app.use(express.json());
}

function registerEndpoints(
  app: express.Application,
  server: McpServer
): void {
  registerRootEndpoint(app);
  registerHealthEndpoint(app);
  registerMcpEndpoint(app, server);
}

function registerRootEndpoint(app: express.Application): void {
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      message: 'Babylon MCP Server',
      server: MCP_SERVER_CONFIG.name,
      version: MCP_SERVER_CONFIG.version,
      endpoints: {
        mcp: '/mcp (POST)',
        health: '/health',
      },
    });
  });
}

function registerHealthEndpoint(app: express.Application): void {
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      server: MCP_SERVER_CONFIG.name,
      version: MCP_SERVER_CONFIG.version,
    });
  });
}

function registerMcpEndpoint(
  app: express.Application,
  server: McpServer
): void {
  app.post('/mcp', async (req: Request, res: Response) => {
    await handleMcpRequest(server, req, res);
  });
}

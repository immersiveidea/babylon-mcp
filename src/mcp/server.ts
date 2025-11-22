import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import express from 'express';
import { MCP_SERVER_CONFIG } from './config.js';
import { setupHandlers } from './handlers.js';
import { setupRoutes } from './routes.js';
import { RepositoryManager } from './repository-manager.js';

/**
 * Babylon MCP Server
 * Provides documentation search and examples for Babylon.js development
 */
export class BabylonMCPServer {
  private server: McpServer;
  private app: express.Application;
  private httpServer?: ReturnType<express.Application['listen']>;
  private repositoryManager: RepositoryManager;

  constructor() {
    this.app = express();
    this.repositoryManager = new RepositoryManager();
    this.server = new McpServer(
      {
        name: MCP_SERVER_CONFIG.name,
        version: MCP_SERVER_CONFIG.version,
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
        instructions: MCP_SERVER_CONFIG.instructions,
      }
    );

    setupHandlers(this.server);
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    process.on('SIGINT', async () => {
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.shutdown();
      process.exit(0);
    });
  }

  async start(port: number = 4000): Promise<void> {
    await this.repositoryManager.initializeAllRepositories();
    setupRoutes(this.app, this.server);
    this.startHttpServer(port);
  }

  private startHttpServer(port: number): void {
    this.httpServer = this.app.listen(port, () => {
      this.logServerInfo(port);
    });
  }

  private logServerInfo(port: number): void {
    console.log(`${MCP_SERVER_CONFIG.name} v${MCP_SERVER_CONFIG.version} running on HTTP`);
    console.log(`HTTP Server: http://localhost:${port}`);
    console.log(`MCP Endpoint: http://localhost:${port}/mcp`);
    console.log(`Capabilities: ${Object.keys(MCP_SERVER_CONFIG.capabilities).join(', ')}`);
    console.log('Ready to serve Babylon.js documentation');
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down Babylon MCP Server...');
    await this.closeMcpServer();
    await this.closeHttpServer();
    console.log('Server shutdown complete');
  }

  private async closeMcpServer(): Promise<void> {
    await this.server.close();
  }

  private async closeHttpServer(): Promise<void> {
    if (!this.httpServer) return;

    await new Promise<void>((resolve) => {
      this.httpServer?.close(() => {
        console.log('HTTP server closed');
        resolve();
      });
    });
  }
}

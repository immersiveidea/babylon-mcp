import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { setupRoutes } from './routes.js';
import { MCP_SERVER_CONFIG } from './config.js';

vi.mock('./transport.js', () => ({
  handleMcpRequest: vi.fn(async (_server, _req, res) => {
    res.json({ jsonrpc: '2.0', result: { success: true }, id: 1 });
  }),
}));

describe('Express Routes', () => {
  let app: express.Application;
  let mockServer: McpServer;

  beforeEach(() => {
    app = express();
    mockServer = {} as McpServer;
    setupRoutes(app, mockServer);
  });

  describe('GET /', () => {
    it('should return server information', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Babylon MCP Server');
    });

    it('should include server name and version', async () => {
      const response = await request(app).get('/');

      expect(response.body).toHaveProperty('server', MCP_SERVER_CONFIG.name);
      expect(response.body).toHaveProperty('version', MCP_SERVER_CONFIG.version);
    });

    it('should list available endpoints', async () => {
      const response = await request(app).get('/');

      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('mcp', '/mcp (POST)');
      expect(response.body.endpoints).toHaveProperty('health', '/health');
    });

    it('should return JSON content type', async () => {
      const response = await request(app).get('/');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
    });

    it('should include server name and version', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('server', MCP_SERVER_CONFIG.name);
      expect(response.body).toHaveProperty('version', MCP_SERVER_CONFIG.version);
    });

    it('should return JSON content type', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('POST /mcp', () => {
    it('should accept MCP requests', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      };

      const response = await request(app).post('/mcp').send(mcpRequest);

      expect(response.status).toBe(200);
    });

    it('should handle JSON body', async () => {
      const mcpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'search_babylon_docs',
          arguments: { query: 'test' },
        },
        id: 1,
      };

      const response = await request(app)
        .post('/mcp')
        .set('Content-Type', 'application/json')
        .send(mcpRequest);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('jsonrpc', '2.0');
    });

    it('should delegate to handleMcpRequest', async () => {
      const { handleMcpRequest } = await import('./transport.js');

      const mcpRequest = {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      };

      await request(app).post('/mcp').send(mcpRequest);

      expect(handleMcpRequest).toHaveBeenCalled();
    });
  });

  describe('Middleware', () => {
    it('should parse JSON bodies', async () => {
      const jsonData = { test: 'data' };

      const response = await request(app)
        .post('/mcp')
        .set('Content-Type', 'application/json')
        .send(jsonData);

      expect(response.status).toBe(200);
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
    });
  });
});

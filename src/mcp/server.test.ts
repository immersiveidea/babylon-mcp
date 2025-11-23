import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BabylonMCPServer } from './server.js';
import { MCP_SERVER_CONFIG } from './config.js';

vi.mock('express', () => ({
  default: vi.fn(() => ({
    listen: vi.fn((_port: number, callback: () => void) => {
      callback();
      return {
        close: vi.fn((cb: () => void) => cb()),
      };
    }),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  const MockMcpServer = vi.fn(function () {
    return {
      close: vi.fn().mockResolvedValue(undefined),
      registerTool: vi.fn(),
    };
  });
  return { McpServer: MockMcpServer };
});

vi.mock('./handlers/index.js', () => ({
  setupHandlers: vi.fn(),
}));

vi.mock('./routes.js', () => ({
  setupRoutes: vi.fn(),
}));

vi.mock('./repository-manager.js', () => ({
  RepositoryManager: vi.fn(function () {
    return {
      initializeAllRepositories: vi.fn().mockResolvedValue(undefined),
      getRepositoryPath: vi.fn((name: string) => `/mock/path/${name}`),
    };
  }),
}));

describe('BabylonMCPServer', () => {
  let server: BabylonMCPServer;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('Constructor', () => {
    it('should create Express app', () => {
      server = new BabylonMCPServer();

      expect(express).toHaveBeenCalled();
    });

    it('should create McpServer with correct config', () => {
      server = new BabylonMCPServer();

      expect(McpServer).toHaveBeenCalledWith(
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
    });

    it('should setup MCP handlers', async () => {
      const { setupHandlers } = await import('./handlers/index.js');

      server = new BabylonMCPServer();

      expect(setupHandlers).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('start()', () => {
    beforeEach(() => {
      server = new BabylonMCPServer();
    });

    it('should setup routes with app and server', async () => {
      const { setupRoutes } = await import('./routes.js');

      await server.start();

      expect(setupRoutes).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
    });

    it('should start HTTP server on default port 4000', async () => {
      const mockApp = (express as unknown as ReturnType<typeof vi.fn>).mock.results[0]!
        .value;

      await server.start();

      expect(mockApp.listen).toHaveBeenCalledWith(4000, expect.any(Function));
    });

    it('should start HTTP server on custom port', async () => {
      const mockApp = (express as unknown as ReturnType<typeof vi.fn>).mock.results[0]!
        .value;

      await server.start(8080);

      expect(mockApp.listen).toHaveBeenCalledWith(8080, expect.any(Function));
    });

    it('should log server information after starting', async () => {
      await server.start(4000);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(MCP_SERVER_CONFIG.name)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(MCP_SERVER_CONFIG.version)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:4000')
      );
    });
  });

  describe('shutdown()', () => {
    beforeEach(() => {
      server = new BabylonMCPServer();
    });

    it('should log shutdown message', async () => {
      await server.shutdown();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Shutting down Babylon MCP Server...'
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('Server shutdown complete');
    });

    it('should close MCP server', async () => {
      const mockMcpServer = (McpServer as unknown as ReturnType<typeof vi.fn>).mock
        .results[0]!.value;

      await server.shutdown();

      expect(mockMcpServer.close).toHaveBeenCalled();
    });

    it('should close HTTP server if running', async () => {
      await server.start();

      const mockApp = (express as unknown as ReturnType<typeof vi.fn>).mock.results[0]!
        .value;
      const mockHttpServer = mockApp.listen.mock.results[0]!.value;

      await server.shutdown();

      expect(mockHttpServer.close).toHaveBeenCalled();
    });

    it('should handle shutdown when HTTP server not started', async () => {
      await expect(server.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    let originalProcessOn: typeof process.on;
    let processListeners: Record<string, ((...args: unknown[]) => void)[]>;

    beforeEach(() => {
      processListeners = {};
      originalProcessOn = process.on;
      process.on = vi.fn((event: string, callback: (...args: unknown[]) => void) => {
        if (!processListeners[event]) processListeners[event] = [];
        processListeners[event].push(callback);
        return process;
      }) as typeof process.on;
    });

    afterEach(() => {
      process.on = originalProcessOn;
    });

    it('should setup SIGINT handler', () => {
      server = new BabylonMCPServer();

      expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });

    it('should setup SIGTERM handler', () => {
      server = new BabylonMCPServer();

      expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    });

    it('should shutdown on SIGINT', async () => {
      server = new BabylonMCPServer();
      const shutdownSpy = vi.spyOn(server, 'shutdown').mockResolvedValue();
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        return undefined as never;
      });

      const sigintHandlers = processListeners['SIGINT'];
      expect(sigintHandlers).toBeDefined();
      expect(sigintHandlers!.length).toBeGreaterThan(0);

      await sigintHandlers![0]!();

      expect(shutdownSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);

      shutdownSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should shutdown on SIGTERM', async () => {
      server = new BabylonMCPServer();
      const shutdownSpy = vi.spyOn(server, 'shutdown').mockResolvedValue();
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        return undefined as never;
      });

      const sigtermHandlers = processListeners['SIGTERM'];
      expect(sigtermHandlers).toBeDefined();
      expect(sigtermHandlers!.length).toBeGreaterThan(0);

      await sigtermHandlers![0]!();

      expect(shutdownSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);

      shutdownSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });
});

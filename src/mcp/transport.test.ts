import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type Request, type Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { handleMcpRequest } from './transport.js';

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => {
  const MockStreamableHTTPServerTransport = vi.fn(function () {
    return {
      handleRequest: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    };
  });
  return { StreamableHTTPServerTransport: MockStreamableHTTPServerTransport };
});

describe('MCP Transport', () => {
  let mockServer: McpServer;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockServer = {
      connect: vi.fn().mockResolvedValue(undefined),
    } as unknown as McpServer;

    mockRequest = {
      body: {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      },
    };

    const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
    mockResponse = {
      on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
        return mockResponse as Response;
      }),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      headersSent: false,
    };
  });

  describe('handleMcpRequest', () => {
    it('should create StreamableHTTPServerTransport', async () => {
      await handleMcpRequest(
        mockServer,
        mockRequest as Request,
        mockResponse as Response
      );

      expect(StreamableHTTPServerTransport).toHaveBeenCalledWith({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
    });

    it('should connect server to transport', async () => {
      await handleMcpRequest(
        mockServer,
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockServer.connect).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should call transport.handleRequest with correct parameters', async () => {
      await handleMcpRequest(
        mockServer,
        mockRequest as Request,
        mockResponse as Response
      );

      const mockTransportInstance = (
        StreamableHTTPServerTransport as unknown as ReturnType<typeof vi.fn>
      ).mock.results[0]!.value;

      expect(mockTransportInstance.handleRequest).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        mockRequest.body
      );
    });

    it('should register close listener on response', async () => {
      await handleMcpRequest(
        mockServer,
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should close transport when response closes', async () => {
      const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
      mockResponse.on = vi.fn((event: string, callback: (...args: unknown[]) => void) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
        return mockResponse as Response;
      });

      await handleMcpRequest(
        mockServer,
        mockRequest as Request,
        mockResponse as Response
      );

      const closeCallbacks = listeners['close'];
      expect(closeCallbacks).toBeDefined();
      expect(closeCallbacks!.length).toBeGreaterThan(0);

      const mockTransportInstance = (
        StreamableHTTPServerTransport as unknown as ReturnType<typeof vi.fn>
      ).mock.results[0]!.value;

      closeCallbacks![0]!();
      expect(mockTransportInstance.close).toHaveBeenCalled();
    });

    it('should handle errors and return JSON-RPC error response', async () => {
      const errorMessage = 'Test error';
      mockServer.connect = vi.fn().mockRejectedValue(new Error(errorMessage));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handleMcpRequest(
        mockServer,
        mockRequest as Request,
        mockResponse as Response
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error handling MCP request:',
        expect.any(Error)
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });

      consoleErrorSpy.mockRestore();
    });

    it('should not send error response if headers already sent', async () => {
      mockServer.connect = vi.fn().mockRejectedValue(new Error('Test error'));
      mockResponse.headersSent = true;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handleMcpRequest(
        mockServer,
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle transport.handleRequest errors', async () => {
      // Create a mock that will throw an error when handleRequest is called
      vi.mocked(StreamableHTTPServerTransport).mockImplementationOnce(
        vi.fn(function () {
          return {
            handleRequest: vi.fn().mockRejectedValue(new Error('Transport error')),
            close: vi.fn(),
          };
        }) as never
      );

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handleMcpRequest(
        mockServer,
        mockRequest as Request,
        mockResponse as Response
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Error Response Format', () => {
    it('should return valid JSON-RPC 2.0 error format', async () => {
      mockServer.connect = vi.fn().mockRejectedValue(new Error('Test'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await handleMcpRequest(
        mockServer,
        mockRequest as Request,
        mockResponse as Response
      );

      const errorResponse = (mockResponse.json as ReturnType<typeof vi.fn>).mock
        .calls[0]![0];

      expect(errorResponse).toHaveProperty('jsonrpc', '2.0');
      expect(errorResponse).toHaveProperty('error');
      expect(errorResponse.error).toHaveProperty('code', -32603);
      expect(errorResponse.error).toHaveProperty('message', 'Internal server error');
      expect(errorResponse).toHaveProperty('id', null);

      consoleErrorSpy.mockRestore();
    });
  });
});

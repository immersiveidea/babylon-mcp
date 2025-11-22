import { describe, it, expect } from 'vitest';
import { MCP_SERVER_CONFIG } from './config.js';

describe('MCP_SERVER_CONFIG', () => {
  describe('Basic Metadata', () => {
    it('should have correct name', () => {
      expect(MCP_SERVER_CONFIG.name).toBe('babylon-mcp');
    });

    it('should have valid version format', () => {
      expect(MCP_SERVER_CONFIG.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have description', () => {
      expect(MCP_SERVER_CONFIG.description).toBeDefined();
      expect(MCP_SERVER_CONFIG.description.length).toBeGreaterThan(0);
    });

    it('should have author', () => {
      expect(MCP_SERVER_CONFIG.author).toBeDefined();
    });
  });

  describe('Capabilities', () => {
    it('should define tools capability', () => {
      expect(MCP_SERVER_CONFIG.capabilities.tools).toBeDefined();
      expect(MCP_SERVER_CONFIG.capabilities.tools.description).toBeDefined();
    });

    it('should list available tools', () => {
      const tools = MCP_SERVER_CONFIG.capabilities.tools.available;
      expect(tools).toContain('search_babylon_docs');
      expect(tools).toContain('get_babylon_doc');
      expect(tools.length).toBe(2);
    });

    it('should define prompts capability', () => {
      expect(MCP_SERVER_CONFIG.capabilities.prompts).toBeDefined();
      expect(Array.isArray(MCP_SERVER_CONFIG.capabilities.prompts.available)).toBe(true);
    });

    it('should define resources capability', () => {
      expect(MCP_SERVER_CONFIG.capabilities.resources).toBeDefined();
      expect(Array.isArray(MCP_SERVER_CONFIG.capabilities.resources.available)).toBe(true);
    });
  });

  describe('Instructions', () => {
    it('should provide usage instructions', () => {
      expect(MCP_SERVER_CONFIG.instructions).toBeDefined();
      expect(MCP_SERVER_CONFIG.instructions.length).toBeGreaterThan(50);
    });

    it('should mention tool names in instructions', () => {
      const instructions = MCP_SERVER_CONFIG.instructions;
      expect(instructions).toContain('search_babylon_docs');
      expect(instructions).toContain('get_babylon_doc');
    });
  });

  describe('Transport Configuration', () => {
    it('should use HTTP transport', () => {
      expect(MCP_SERVER_CONFIG.transport.type).toBe('http');
    });

    it('should use StreamableHTTP protocol', () => {
      expect(MCP_SERVER_CONFIG.transport.protocol).toBe('StreamableHTTP');
    });

    it('should have valid default port', () => {
      expect(MCP_SERVER_CONFIG.transport.defaultPort).toBe(4000);
      expect(MCP_SERVER_CONFIG.transport.defaultPort).toBeGreaterThan(1024);
      expect(MCP_SERVER_CONFIG.transport.defaultPort).toBeLessThan(65536);
    });

    it('should have MCP endpoint', () => {
      expect(MCP_SERVER_CONFIG.transport.endpoint).toBe('/mcp');
    });
  });

  describe('Sources', () => {
    it('should define documentation source', () => {
      const docSource = MCP_SERVER_CONFIG.sources.documentation;
      expect(docSource.repository).toContain('github.com');
      expect(docSource.repository).toContain('BabylonJS/Documentation');
    });

    it('should define Babylon.js source', () => {
      const babylonSource = MCP_SERVER_CONFIG.sources.babylonSource;
      expect(babylonSource.repository).toContain('BabylonJS/Babylon.js');
    });

    it('should define Havok source', () => {
      const havokSource = MCP_SERVER_CONFIG.sources.havok;
      expect(havokSource.repository).toContain('BabylonJS/havok');
    });

    it('should have valid GitHub URLs for all sources', () => {
      const sources = Object.values(MCP_SERVER_CONFIG.sources);
      sources.forEach((source) => {
        expect(source.repository).toMatch(/^https:\/\/github\.com\/.+\.git$/);
      });
    });
  });

  describe('Type Safety', () => {
    it('should be a const object', () => {
      const config = MCP_SERVER_CONFIG;
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });
  });
});

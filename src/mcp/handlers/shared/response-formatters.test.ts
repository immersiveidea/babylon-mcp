import { describe, it, expect } from 'vitest';
import {
  formatJsonResponse,
  formatErrorResponse,
  formatNoResultsResponse,
  formatNotFoundResponse,
} from './response-formatters.js';

describe('Response Formatters', () => {
  describe('formatJsonResponse', () => {
    it('should format data as JSON text response', () => {
      const data = { test: 'value', count: 42 };
      const result = formatJsonResponse(data);

      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');

      const parsed = JSON.parse(result.content[0]!.text);
      expect(parsed).toEqual(data);
    });

    it('should handle complex nested objects', () => {
      const data = {
        nested: { array: [1, 2, 3], obj: { key: 'value' } },
        nullValue: null,
      };
      const result = formatJsonResponse(data);

      const parsed = JSON.parse(result.content[0]!.text);
      expect(parsed).toEqual(data);
    });
  });

  describe('formatErrorResponse', () => {
    it('should format Error instances', () => {
      const error = new Error('Test error message');
      const result = formatErrorResponse(error, 'testing');

      expect(result.content[0]!.type).toBe('text');
      expect(result.content[0]!.text).toBe('Error testing: Test error message');
    });

    it('should format string errors', () => {
      const error = 'String error';
      const result = formatErrorResponse(error, 'processing');

      expect(result.content[0]!.text).toBe('Error processing: String error');
    });

    it('should format unknown error types', () => {
      const error = { code: 404 };
      const result = formatErrorResponse(error, 'fetching');

      expect(result.content[0]!.text).toContain('Error fetching:');
    });
  });

  describe('formatNoResultsResponse', () => {
    it('should format no results message for documentation', () => {
      const result = formatNoResultsResponse('test query', 'documentation');

      expect(result.content[0]!.type).toBe('text');
      expect(result.content[0]!.text).toContain('No documentation found');
      expect(result.content[0]!.text).toContain('test query');
    });

    it('should format no results message for API', () => {
      const result = formatNoResultsResponse('getMeshByName', 'API documentation');

      expect(result.content[0]!.text).toContain('No API documentation found');
      expect(result.content[0]!.text).toContain('getMeshByName');
    });

    it('should format no results message for source code', () => {
      const result = formatNoResultsResponse('scene rendering', 'source code');

      expect(result.content[0]!.text).toContain('No source code found');
      expect(result.content[0]!.text).toContain('scene rendering');
    });
  });

  describe('formatNotFoundResponse', () => {
    it('should format not found message without additional info', () => {
      const result = formatNotFoundResponse('/test/path', 'Document');

      expect(result.content[0]!.type).toBe('text');
      expect(result.content[0]!.text).toBe('Document not found: /test/path.');
    });

    it('should format not found message with additional info', () => {
      const result = formatNotFoundResponse(
        'scene.ts',
        'Source file',
        'The path may be incorrect.'
      );

      expect(result.content[0]!.text).toBe(
        'Source file not found: scene.ts. The path may be incorrect.'
      );
    });

    it('should handle empty additional info', () => {
      const result = formatNotFoundResponse('test-id', 'Resource', '');

      expect(result.content[0]!.text).toBe('Resource not found: test-id.');
    });
  });
});

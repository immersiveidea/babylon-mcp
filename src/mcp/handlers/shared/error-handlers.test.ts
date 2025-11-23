import { describe, it, expect } from 'vitest';
import { withErrorHandling } from './error-handlers.js';

describe('Error Handlers', () => {
  describe('withErrorHandling', () => {
    it('should return result when handler succeeds', async () => {
      const handler = async (value: number) => ({ result: value * 2 });
      const wrappedHandler = withErrorHandling(handler, 'testing');

      const result = await wrappedHandler(5);

      expect(result).toEqual({ result: 10 });
    });

    it('should catch and format errors when handler throws', async () => {
      const handler = async () => {
        throw new Error('Test error');
      };
      const wrappedHandler = withErrorHandling(handler, 'processing data');

      const result = await wrappedHandler();

      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]!.text).toContain('Error processing data');
      expect(result.content[0]!.text).toContain('Test error');
    });

    it('should handle string errors', async () => {
      const handler = async () => {
        throw 'String error message';
      };
      const wrappedHandler = withErrorHandling(handler, 'fetching');

      const result = await wrappedHandler();

      expect(result.content[0]!.text).toContain('Error fetching');
      expect(result.content[0]!.text).toContain('String error message');
    });

    it('should handle non-Error objects', async () => {
      const handler = async () => {
        throw { code: 500, message: 'Server error' };
      };
      const wrappedHandler = withErrorHandling(handler, 'API call');

      const result = await wrappedHandler();

      expect(result.content[0]!.text).toContain('Error API call');
    });

    it('should pass through handler arguments', async () => {
      const handler = async (a: number, b: string, c: boolean) => ({
        a,
        b,
        c,
      });
      const wrappedHandler = withErrorHandling(handler, 'testing');

      const result = await wrappedHandler(42, 'test', true);

      expect(result).toEqual({ a: 42, b: 'test', c: true });
    });

    it('should handle async errors in promise rejections', async () => {
      const handler = async () => {
        return Promise.reject(new Error('Async rejection'));
      };
      const wrappedHandler = withErrorHandling(handler, 'async operation');

      const result = await wrappedHandler();

      expect(result.content[0]!.text).toContain('Error async operation');
      expect(result.content[0]!.text).toContain('Async rejection');
    });
  });
});

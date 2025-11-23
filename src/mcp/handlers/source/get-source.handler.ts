import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getSearchInstance } from '../shared/search-instance.js';
import {
  formatJsonResponse,
  formatNotFoundResponse,
} from '../shared/response-formatters.js';
import { withErrorHandling } from '../shared/error-handlers.js';

export function register(server: McpServer): void {
  server.registerTool(
    'get_babylon_source',
    {
      description:
        'Retrieve full Babylon.js source code file or specific line range',
      inputSchema: {
        filePath: z
          .string()
          .describe(
            'Relative file path from repository root (e.g., "packages/dev/core/src/scene.ts")'
          ),
        startLine: z
          .number()
          .optional()
          .describe('Optional start line number (1-indexed)'),
        endLine: z
          .number()
          .optional()
          .describe('Optional end line number (1-indexed)'),
      },
    },
    withErrorHandling(
      async ({ filePath, startLine, endLine }) => {
        const search = await getSearchInstance();
        const sourceCode = await search.getSourceFile(filePath, startLine, endLine);

        if (!sourceCode) {
          return formatNotFoundResponse(
            filePath,
            'Source file',
            'The path may be incorrect or the file does not exist in the repository.'
          );
        }

        return formatJsonResponse({
          filePath,
          startLine: startLine || 1,
          endLine: endLine || sourceCode.split('\n').length,
          totalLines: sourceCode.split('\n').length,
          /* c8 ignore next 3 */
          language:
            filePath.endsWith('.ts') || filePath.endsWith('.tsx')
              ? 'typescript'
              : 'javascript',
          content: sourceCode,
        });
      },
      'retrieving source file'
    )
  );
}

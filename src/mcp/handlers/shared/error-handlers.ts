import { formatErrorResponse } from './response-formatters.js';

type HandlerFunction = (...args: any[]) => Promise<any>;

export function withErrorHandling(
  handler: HandlerFunction,
  context: string
): HandlerFunction {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      return formatErrorResponse(error, context);
    }
  };
}

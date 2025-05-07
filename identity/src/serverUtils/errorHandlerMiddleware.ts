import { Request, Response } from "express";
import { ApiError } from "./apiError.js";
import * as logger from "../logger.js";
// Middleware to handle errors
// Must define 4 params for express to recognize this as an error handler
export const errorHandlerMiddleware = (err: Error, _req: Request, res: Response, _next: unknown) => {
  // If we have an API Error, use the provided code and message
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.statusCode,
    });
  }

  // Otherwise, format error messages for unexpected errors
  // - Server will log just the error name and backtrace (no error message)
  // - Client will get a generic error message with additional details under `details`
  // - Both include a random ID that can be used to tie the error to the trace if a
  //   user reaches out with issues
  const randomID = Math.random().toString(36).substring(2, 8);

  logger.error("Unexpected error:", formatSystemMessage(err, randomID));

  return res.status(500).json(formatUserResponse(err, randomID));
};

const formatSystemMessage = (exception: Error, randomID: string): string =>
  // Drop the message (and first line of stack, which is just the message) as it may contain PII
  `${exception.name} ${exception.stack.replace(/^.*\n *(?=at)/m, "")} (ID: ${randomID})`;

const formatUserResponse = (exception: Error, randomID: string) => ({
  error: `Unexpected server error (ID: ${randomID})`,
  code: 500,
});

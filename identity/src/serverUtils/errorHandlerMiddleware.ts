import { Request, Response } from "express";
import { formatExceptionMessages } from "@gitcoin/passport-platforms";
import { ApiError } from "./apiError.js";

// Middleware to handle errors
// Must define 4 params for express to recognize this as an error handler
export const errorHandlerMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: unknown,
) => {
  // TODO
  console.error("HERE", err);

  if (err instanceof ApiError) {
    // TODO log if 500?
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Otherwise, format error messages for unexpected errors
  // - Server will log just the error name and backtrace (no error message)
  // - Client will get a generic error message
  // - Both include a tag that can be used to tie the error
  //   to the trace if a user reaches out with issues
  const { systemMessage, userMessage } = formatExceptionMessages(
    err,
    "Unexpected server error",
  );

  console.log("Unexpected error: ", systemMessage); // eslint-disable-line no-console

  return res.status(500).json({
    status: "error",
    message: userMessage,
  });
};

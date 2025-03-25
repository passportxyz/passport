import { Request, Response } from "express";
import { formatExceptionMessages } from "@gitcoin/passport-platforms";

export type Code =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "SERVER_ERROR";

const codeMap: Record<Code, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

export class ApiError extends Error {
  public statusCode: number;
  constructor(
    public message: string,
    statusCode: Code,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = codeMap[statusCode];
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnexpectedApiError extends ApiError {
  public from: Error;

  static fromError(
    err: Error,
    message: string = "UnexpectedApiError",
    statusCode: Code = "SERVER_ERROR",
  ): UnexpectedApiError {
    const unexpectedApiError = new UnexpectedApiError(message, statusCode);
    unexpectedApiError.from = err;
    return unexpectedApiError;
  }
}

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

  // Handle custom errors
  if (err instanceof UnexpectedApiError) {
    const { systemMessage, userMessage } = formatExceptionMessages(
      err.from,
      err.message,
    );

    console.log("Unexpected error: ", systemMessage);

    return res.status(err.statusCode).json({
      status: "error",
      message: userMessage,
    });
  }

  if (err instanceof ApiError) {
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

  console.log("Unhandled unexpected error: ", systemMessage);

  return res.status(codeMap["SERVER_ERROR"]).json({
    status: "error",
    message: userMessage,
  });
};

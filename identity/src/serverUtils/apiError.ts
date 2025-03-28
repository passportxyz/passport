export type Code = "BAD_REQUEST" | "UNAUTHORIZED" | "SERVER_ERROR";

const codeMap: Record<Code, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
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

// These classes can be used when it is not convenient/possible
// to explicitly pass a statusCode to the constructor
export class InternalApiError extends ApiError {
  constructor(message: string) {
    super(message, "SERVER_ERROR");
  }
}

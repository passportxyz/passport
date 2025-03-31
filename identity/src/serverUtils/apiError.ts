export type Code = "400_BAD_REQUEST" | "401_UNAUTHORIZED" | "500_SERVER_ERROR";

const codeMap: Record<Code, number> = {
  "400_BAD_REQUEST": 400,
  "401_UNAUTHORIZED": 401,
  "500_SERVER_ERROR": 500,
};

export class ApiError extends Error {
  public statusCode: number;

  constructor(
    public message: string,
    statusCode: Code
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
    super(message, "500_SERVER_ERROR");
  }
}

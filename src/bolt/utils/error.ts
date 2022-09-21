export enum ErrorCodes {
  BAD_REQUEST = 400,
  INTERNAL_SERVER_ERROR = 500,
  UNAUTHORISED = 401,
  NOT_FOUND = 404,
}

class APIError extends Error {
  public statusCode: ErrorCodes;
  public errorMessage: string;

  constructor(errorMessage: string, statusCode: number) {
    super(errorMessage);

    this.errorMessage = errorMessage;
    this.statusCode = statusCode;

    console.error(
      `[BOLT] message: ${errorMessage}, stack: ${this.stack || ""}`
    );
  }
}

export default APIError;

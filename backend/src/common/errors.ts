export type ErrorDetail = {
  field: string;
  issue: string;
};

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: ErrorDetail[];

  constructor(statusCode: number, code: string, message: string, details: ErrorDetail[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const validationError = (details: ErrorDetail[], message = "Request body is invalid.") =>
  new ApiError(400, "VALIDATION_ERROR", message, details);

export const unauthenticatedError = () =>
  new ApiError(401, "UNAUTHENTICATED", "Authentication is required.");

export const notFoundError = (message = "Resource not found.") =>
  new ApiError(404, "NOT_FOUND", message);

export const conflictError = (details: ErrorDetail[], message: string) =>
  new ApiError(409, "CONFLICT", message, details);

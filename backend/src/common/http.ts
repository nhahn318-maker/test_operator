import { ZodError } from "zod";

import { ApiError, validationError } from "./errors";

export const SESSION_COOKIE_NAME = "todo_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export const toValidationError = (error: ZodError, message = "Request body is invalid.") =>
  validationError(
    error.issues.map((issue) => ({
      field: issue.path.join(".") || "body",
      issue: issue.message,
    })),
    message,
  );

export const parseOffsetCursor = (cursor?: string) => {
  if (!cursor) {
    return 0;
  }

  const decoded = Buffer.from(cursor, "base64url").toString("utf8");
  const value = Number(decoded);

  if (!Number.isInteger(value) || value < 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "Query parameters are invalid.", [
      { field: "cursor", issue: "Must be a valid cursor." },
    ]);
  }

  return value;
};

export const encodeOffsetCursor = (offset: number) =>
  Buffer.from(String(offset), "utf8").toString("base64url");

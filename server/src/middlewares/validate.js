import { ApiError } from "../utils/ApiError.js";

export function parse(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ApiError("VALIDATION_ERROR", "Request validation failed",
      result.error.issues.map((issue) => ({ field: issue.path.join(".") || "request", message: issue.message })));
  }
  return result.data;
}

export function validate(schemas) {
  return (req, _res, next) => {
    try {
      req.validated = Object.fromEntries(Object.entries(schemas).map(([key, schema]) => [key, parse(schema, req[key])]));
      next();
    } catch (error) { next(error); }
  };
}

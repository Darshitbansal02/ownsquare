import ApiError from '../utils/ApiError.js';
export const validate = (schema, source = 'body') => (req, res, next) => {
  const parsed = schema.safeParse(req[source] ?? {});
  if (!parsed.success) return next(new ApiError('VALIDATION_ERROR','Request validation failed',parsed.error.issues.map(i=>({field:i.path.join('.') || source,message:i.message}))));
  req.validated ??= {}; req.validated[source] = parsed.data; next();
};

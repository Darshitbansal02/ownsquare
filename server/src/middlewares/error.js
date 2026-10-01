import ApiError from '../utils/ApiError.js';
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === 11000 && error.keyPattern?.email) error = new ApiError('EMAIL_ALREADY_EXISTS','This email is already registered');
  if (error.type === 'entity.parse.failed') error = new ApiError('VALIDATION_ERROR','Invalid JSON body');
  if (error.type === 'entity.too.large') error = new ApiError('VALIDATION_ERROR','Request body is too large');
  if (error.code === 'LIMIT_FILE_SIZE') error = new ApiError('UPLOAD_TOO_LARGE','Maximum upload size is 5 MB');
  if (error.name === 'MulterError') error = new ApiError('VALIDATION_ERROR','Upload one file using the file field');
  if (!(error instanceof ApiError)) { console.error('Request failed', {name:error.name}); error = new ApiError('INTERNAL_ERROR','An unexpected error occurred'); }
  res.status(error.status).json({success:false,error:{code:error.code,message:error.message,details:error.details}});
}

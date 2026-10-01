import { errorStatus } from '../../../shared/errorCodes.js';
export default class ApiError extends Error {
  constructor(code, message, details = []) { super(message); this.code = code; this.status = errorStatus[code] ?? 500; this.details = details; }
}

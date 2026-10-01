import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

// Builds the persisted-current-user authentication middleware.
// The decoded token only identifies the account; role, isActive and sessionVersion
// are always re-read from the database so deactivated or demoted users fail immediately.
export function createAuthenticate({ models, secret }) {
  if (typeof secret !== "string" || secret.length < 16) {
    throw new TypeError("JWT_SECRET must be a strong configured secret");
  }
  return async function authenticate(req, _res, next) {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith("Bearer ")) {
        throw new ApiError("UNAUTHORIZED", "Missing or malformed authorization header");
      }
      const token = header.slice(7).trim();
      if (!token) throw new ApiError("UNAUTHORIZED", "Token not provided");
      let claims;
      try {
        claims = jwt.verify(token, secret);
      } catch (error) {
        throw new ApiError("UNAUTHORIZED", error.name === "TokenExpiredError" ? "Token has expired" : "Invalid token");
      }
      const user = await models.User.findById(claims.sub);
      if (!user) throw new ApiError("UNAUTHORIZED", "Account no longer exists");
      if (!user.isActive) throw new ApiError("UNAUTHORIZED", "Account is deactivated");
      if (claims.sessionVersion !== user.sessionVersion) {
        throw new ApiError("UNAUTHORIZED", "Session is no longer valid");
      }
      req.user = user;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

// Role check runs after authentication and reads the persisted role, never a token claim.
export function createRequireRole() {
  return (...allowedRoles) => (req, _res, next) => {
    if (!req.user) return next(new ApiError("UNAUTHORIZED", "Authentication required"));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError("FORBIDDEN", "Role is not authorized to access this resource"));
    }
    return next();
  };
}

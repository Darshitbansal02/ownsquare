import {Router} from 'express';
import {authenticate} from '../middlewares/auth.js';
import {validate} from '../middlewares/validate.js';
import {authRateLimit} from '../middlewares/rateLimit.js';
import {registerSchema,loginSchema,emptySchema,forgotSchema,resetSchema,resetParams} from '../validators/auth.schema.js';
import {authController} from '../controllers/auth.controller.js';
import {createAuthService} from '../services/auth.service.js';
import ApiError from '../utils/ApiError.js';
export function authRoutes(env,mailer) {
  const router = Router(), controller = authController(createAuthService(env,mailer), env), auth = authenticate(env);
  router.use(authRateLimit(env));
  const originGuard = (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && origin !== env.CLIENT_URL) {
      return next(new ApiError('FORBIDDEN', 'Cross-origin request rejected'));
    }
    next();
  };
  router.post('/register',validate(registerSchema),controller.register);
  router.post('/login',validate(loginSchema),controller.login);
  router.post('/refresh',originGuard,validate(emptySchema),controller.refresh);
  router.post('/logout',auth,validate(emptySchema),controller.logout);
  router.get('/me',auth,controller.me);
  router.post('/forgot-password',validate(forgotSchema),controller.forgotPassword);
  router.post('/reset-password/:token',validate(resetParams,'params'),validate(resetSchema),controller.resetPassword);
  return router;
}

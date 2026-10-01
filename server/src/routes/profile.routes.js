import {Router} from 'express';
import {authenticate} from '../middlewares/auth.js';
import {validate} from '../middlewares/validate.js';
import {profileSchema,changePasswordSchema} from '../validators/profile.schema.js';
import {createProfileController} from '../controllers/profile.controller.js';
export function profileRoutes(env) {
  const router = Router();router.use(authenticate(env));
  const controller = createProfileController(env);
  router.patch('/me',validate(profileSchema),controller.update);
  router.post('/change-password',validate(changePasswordSchema),controller.changePassword);
  return router;
}

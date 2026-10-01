import {Router} from 'express';
import {authenticate} from '../middlewares/auth.js';
import {validate} from '../middlewares/validate.js';
import {notificationQuery,idParams} from '../validators/notifications.schema.js';
import {emptySchema} from '../validators/auth.schema.js';
import {notificationsController as c} from '../controllers/notifications.controller.js';
import ApiError from '../utils/ApiError.js';
export function notificationsRoutes(env) {
  const router=Router();router.use(authenticate(env),(req,res,next)=>{if(!env.NOTIFICATIONS_ENABLED) throw new ApiError('FEATURE_DISABLED','Notifications are unavailable');next();});
  router.get('/',validate(notificationQuery,'query'),c.list);router.patch('/:id/read',validate(idParams,'params'),validate(emptySchema),c.read);return router;
}

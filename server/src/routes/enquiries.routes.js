import {Router} from 'express';
import {ROLES} from '../../../shared/constants.js';
import {authenticate} from '../middlewares/auth.js';
import {requireRole} from '../middlewares/role.js';
import {validate} from '../middlewares/validate.js';
import {createEnquirySchema,replySchema,enquiryQuery,idParams} from '../validators/enquiries.schema.js';
import {enquiriesController} from '../controllers/enquiries.controller.js';
import ApiError from '../utils/ApiError.js';
export function enquiriesRoutes(env) {
  const router=Router(),c=enquiriesController(env);router.use(authenticate(env),requireRole(ROLES.INVESTOR,ROLES.BROKER),(req,res,next)=>{if(!env.ENQUIRIES_ENABLED) throw new ApiError('FEATURE_DISABLED','Enquiries are unavailable');next();});
  router.post('/',requireRole(ROLES.INVESTOR),validate(createEnquirySchema),c.create);
  router.get('/',validate(enquiryQuery,'query'),c.list);
  router.post('/:id/reply',validate(idParams,'params'),validate(replySchema),c.reply);
  return router;
}

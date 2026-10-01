import {Router} from 'express';
import {ROLES} from '../../../shared/constants.js';
import {authenticate} from '../middlewares/auth.js';
import {requireRole,requireApprovedBroker} from '../middlewares/role.js';
import {requireOwnership} from '../middlewares/ownership.js';
import {validate} from '../middlewares/validate.js';
import {propertyCreateSchema,editSchema,idParams,publicQuery,investorsQuery} from '../validators/properties.schema.js';
import {emptySchema} from '../validators/auth.schema.js';
import {propertiesController} from '../controllers/properties.controller.js';
export function propertiesRoutes(env,verifyMedia) {
  const router=Router(),auth=authenticate(env),roles=requireRole(ROLES.ADMIN,ROLES.BROKER),c=propertiesController(verifyMedia);
  router.get('/',authenticate(env,{optional:true}),validate(publicQuery,'query'),c.list);
  router.get('/:id',authenticate(env,{optional:true}),validate(idParams,'params'),c.detail);
  router.post('/',auth,roles,requireApprovedBroker,validate(propertyCreateSchema),c.create);
  router.patch('/:id',auth,roles,requireApprovedBroker,validate(idParams,'params'),requireOwnership,validate(editSchema),c.update);
  router.post('/:id/submit',auth,roles,requireApprovedBroker,validate(idParams,'params'),requireOwnership,validate(emptySchema),c.submit);
  router.get('/:id/investors',auth,roles,validate(idParams,'params'),requireOwnership,validate(investorsQuery,'query'),c.investors);
  return router;
}

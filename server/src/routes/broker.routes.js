import {Router} from 'express';
import {ROLES} from '../../../shared/constants.js';
import {authenticate} from '../middlewares/auth.js';
import {requireRole} from '../middlewares/role.js';
import {validate} from '../middlewares/validate.js';
import {brokerQuery} from '../validators/broker.schema.js';
import {brokerController} from '../controllers/broker.controller.js';
export function brokerRoutes(env) { const router=Router();router.use(authenticate(env),requireRole(ROLES.BROKER));router.get('/properties',validate(brokerQuery,'query'),brokerController.properties);return router; }

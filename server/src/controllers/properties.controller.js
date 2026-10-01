import {success} from './auth.controller.js';
import {publicProperties,propertyDetail,createProperty,editProperty,propertyInvestors} from '../services/property.service.js';
import {submitProperty} from '../services/propertyLifecycle.service.js';
export const propertiesController = verifyMedia => ({
  list:async(req,res)=>success(res,await publicProperties(req.validated.query),'Properties loaded'),
  detail:async(req,res)=>success(res,await propertyDetail(req.validated.params.id,req.user),'Property loaded'),
  create:async(req,res)=>success(res,await createProperty(req.user,req.validated.body,verifyMedia),'Draft created',201),
  update:async(req,res)=>success(res,await editProperty(req.user,req.validated.params.id,req.validated.body,verifyMedia),'Property updated'),
  submit:async(req,res)=>success(res,await submitProperty(req.user,req.validated.params.id,verifyMedia),'Listing submitted for approval'),
  investors:async(req,res)=>success(res,await propertyInvestors(req.user,req.validated.params.id,req.validated.query),'Investors loaded')
});

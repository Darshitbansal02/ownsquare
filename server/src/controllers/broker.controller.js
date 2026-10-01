import {success} from './auth.controller.js';
import {brokerProperties} from '../services/broker.service.js';
export const brokerController = {properties:async(req,res)=>success(res,await brokerProperties(req.user,req.validated.query),'Your listings loaded')};

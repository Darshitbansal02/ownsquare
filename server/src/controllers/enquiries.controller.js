import {success} from './auth.controller.js';
import {createEnquiry,listEnquiries,replyEnquiry} from '../services/enquiry.service.js';
export const enquiriesController = env=>({create:async(req,res)=>success(res,await createEnquiry(req.user,req.validated.body),'Enquiry created',201),list:async(req,res)=>success(res,await listEnquiries(req.user,req.validated.query),'Enquiries loaded'),reply:async(req,res)=>success(res,await replyEnquiry(req.user,req.validated.params.id,req.validated.body,env.NOTIFICATIONS_ENABLED),'Reply sent')});

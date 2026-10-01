import {Router} from 'express';
import multer from 'multer';
import {authenticate} from '../middlewares/auth.js';
import {success} from '../controllers/auth.controller.js';
import ApiError from '../utils/ApiError.js';
export function uploadsRoutes(env,service) {
  const router=Router();
  router.post('/',authenticate(env),multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1,fields:1,parts:2}}).single('file'),async(req,res)=>{
    const purpose=req.body.purpose;
    if(!['property','kyc'].includes(purpose)||Object.keys(req.body).some(k=>k!=='purpose'))throw new ApiError('VALIDATION_ERROR','Use purpose property or kyc');
    if(purpose==='property'&&!['ADMIN','BROKER'].includes(req.user.role)||purpose==='kyc'&&req.user.role!=='INVESTOR')throw new ApiError('FORBIDDEN','Your role cannot upload this media');
    if(purpose==='property'&&req.user.role==='BROKER'&&!req.user.brokerApproved)throw new ApiError('BROKER_NOT_APPROVED','Admin approval is required before listing');
    if(purpose==='kyc'&&!env.KYC_ENABLED)throw new ApiError('FEATURE_DISABLED','KYC is disabled');
    success(res,await service.upload(req.file,req.user,purpose),'Media uploaded',201);
  });
  return router;
}

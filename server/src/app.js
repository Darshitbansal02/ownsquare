import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import {authRoutes} from './routes/auth.routes.js';
import {profileRoutes} from './routes/profile.routes.js';
import {propertiesRoutes} from './routes/properties.routes.js';
import {brokerRoutes} from './routes/broker.routes.js';
import {enquiriesRoutes} from './routes/enquiries.routes.js';
import {notificationsRoutes} from './routes/notifications.routes.js';
import {uploadsRoutes} from './routes/uploads.routes.js';
import {financeRoutes} from './routes/finance.routes.js';
import {createUploadService} from './services/upload.service.js';
import {errorHandler} from './middlewares/error.js';
import User from './models/User.js';
import Investment from './models/Investment.js';
import ApiError from './utils/ApiError.js';
import {ROLES,INVESTMENT_STATUS} from '../../shared/constants.js';
export function createApp(env,{mailer,uploadService}={}) {
  const app=express(),uploads=uploadService??createUploadService(env);
  app.disable('x-powered-by');app.use(helmet(),cors({origin:env.CLIENT_URL,credentials:true}),cookieParser(),express.json({limit:'100kb'}));
  app.get('/health',async(req,res)=>{if(mongoose.connection.readyState!==1)throw new ApiError('SERVICE_UNAVAILABLE','Database is unavailable');const hello=await mongoose.connection.db.admin().command({hello:1});if(!hello.setName && hello.msg!=='isdbgrid') throw new ApiError('SERVICE_UNAVAILABLE','Transactions are unavailable');res.json({success:true,data:{status:'ok',database:'connected'},message:'Service healthy'});});
  app.use('/api/v1/auth',authRoutes(env,mailer),profileRoutes(env));
  app.use('/api/v1/properties',propertiesRoutes(env,uploads.verifyMedia));
  app.use('/api/v1',financeRoutes(env,uploads));
  app.use('/api/v1/broker',brokerRoutes(env));app.use('/api/v1/enquiries',enquiriesRoutes(env));app.use('/api/v1/notifications',notificationsRoutes(env));app.use('/api/v1/uploads',uploadsRoutes(env,uploads));
  app.get('/api/v1/platform/stats',async(req,res)=>{const [investorCount,raised]=await Promise.all([User.countDocuments({role:ROLES.INVESTOR,isActive:true}),Investment.aggregate([{$match:{status:{$ne:INVESTMENT_STATUS.REFUNDED}}},{$group:{_id:null,total:{$sum:'$amount'}}}])]);const totalRaised=raised[0]?.total??0;if(!Number.isSafeInteger(totalRaised))throw new ApiError('CONFLICT','Platform totals exceed supported range');res.json({success:true,data:{totalRaised,investorCount,features:{kyc:!!env.KYC_ENABLED,withdrawals:!!env.WITHDRAWALS_ENABLED,enquiries:env.ENQUIRIES_ENABLED,notifications:env.NOTIFICATIONS_ENABLED,passwordReset:env.PASSWORD_RESET_ENABLED,ownershipCap:!!env.OWNERSHIP_CAP_ENABLED},paymentProvider:'mock'},message:'Platform capabilities loaded'});});
  app.use((req,res,next)=>next(new ApiError('NOT_FOUND','Endpoint not found')));app.use(errorHandler);return app;
}


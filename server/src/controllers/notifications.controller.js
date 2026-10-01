import Notification from '../models/Notification.js';
import {pageDTO,sortSpec} from '../utils/dto.js';
import {success} from './auth.controller.js';
import ApiError from '../utils/ApiError.js';
export const notificationsController = {
  async list(req,res) { const q=req.validated.query,filter={userId:req.user._id,...(q.read!==undefined && {read:q.read})};const [items,total]=await Promise.all([Notification.find(filter).sort(sortSpec(q.sort)).skip((q.page-1)*q.limit).limit(q.limit),Notification.countDocuments(filter)]);return success(res,pageDTO(items,total,q),'Notifications loaded'); },
  async read(req,res) { const item=await Notification.findOneAndUpdate({_id:req.validated.params.id,userId:req.user._id},{$set:{read:true}},{returnDocument:'after'});if (!item) throw new ApiError('NOT_FOUND','Notification not found');return success(res,item,'Notification marked read'); }
};

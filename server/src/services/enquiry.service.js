import mongoose from 'mongoose';
import Property from '../models/Property.js';
import Enquiry from '../models/Enquiry.js';
import {ROLES,ENQUIRY_STATUS,NOTIFICATION_TYPES} from '../../../shared/constants.js';
import {postNotification} from './notification.service.js';
import {pageDTO,sortSpec} from '../utils/dto.js';
import ApiError from '../utils/ApiError.js';
const scope = user=>user.role===ROLES.INVESTOR ? {investorId:user._id} : {brokerId:user._id};
export async function createEnquiry(user,{propertyId,message}) {
  const p = await Property.findById(propertyId);
  if (!p?.liveAt || !p.brokerId) throw new ApiError('ENQUIRY_UNAVAILABLE','Enquiries are unavailable for this property');
  return Enquiry.create({propertyId:p._id,brokerId:p.brokerId,investorId:user._id,messages:[{from:user._id,text:message,at:new Date()}]});
}
export async function listEnquiries(user,query) {
  const filter={...scope(user),...(query.propertyId && {propertyId:query.propertyId}),...(query.status && {status:query.status})};
  const [items,total]=await Promise.all([Enquiry.find(filter).sort(sortSpec(query.sort)).skip((query.page-1)*query.limit).limit(query.limit),Enquiry.countDocuments(filter)]);
  return pageDTO(items,total,query);
}
export async function replyEnquiry(user,id,{message},notificationsEnabled) {
  let thread;
  await mongoose.connection.transaction(async session=>{
    thread=await Enquiry.findOneAndUpdate({_id:id,...scope(user),status:ENQUIRY_STATUS.OPEN},{$push:{messages:{from:user._id,text:message,at:new Date()}}},{returnDocument:'after',runValidators:true,session});
    if (!thread) {
      if (await Enquiry.exists({_id:id,...scope(user)}).session(session)) throw new ApiError('ENQUIRY_CLOSED','This enquiry is closed');
      throw new ApiError('NOT_FOUND','Enquiry not found');
    }
    if (notificationsEnabled) await postNotification({userId:user.role===ROLES.BROKER ? thread.investorId : thread.brokerId,type:NOTIFICATION_TYPES.ENQUIRY_REPLY,title:'New enquiry reply',body:'You have a new reply to your property enquiry.',link:user.role===ROLES.BROKER ? '/investor/enquiries' : `/broker/properties/${thread.propertyId}`},session);
  });
  return thread;
}

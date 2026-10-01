import {z} from 'zod';
import {objectId,pagination,idParams} from './properties.schema.js';
import {ENQUIRY_STATUS} from '../../../shared/constants.js';
export {idParams};
export const message = z.string().trim().min(1).max(2000);
export const createEnquirySchema = z.strictObject({propertyId:objectId,message});
export const replySchema = z.strictObject({message});
export const enquiryQuery = z.strictObject({...pagination,propertyId:objectId.optional(),status:z.enum(Object.values(ENQUIRY_STATUS)).optional(),sort:z.enum(['createdAt','-createdAt','updatedAt','-updatedAt']).default('-createdAt')});

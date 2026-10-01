import {z} from 'zod';
import {pagination} from './properties.schema.js';
export {idParams} from './properties.schema.js';
export const notificationQuery = z.strictObject({...pagination,read:z.enum(['true','false']).transform(v=>v==='true').optional(),sort:z.enum(['createdAt','-createdAt']).default('-createdAt')});

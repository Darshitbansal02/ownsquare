import { z } from 'zod';
import {name,phone,password} from './auth.schema.js';
export const profileSchema = z.strictObject({name:name.optional(),phone:phone.optional()}).refine(v=>Object.keys(v).length>0,'Supply name or phone');
export const changePasswordSchema = z.strictObject({currentPassword:z.string().min(1).max(256),password});

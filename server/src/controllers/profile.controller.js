import {success} from './auth.controller.js';
import {updateProfile,changePassword} from '../services/profile.service.js';
import {clearRefreshCookie} from '../utils/refreshCookie.js';
export function createProfileController(env) {
  return {
    update:async (req,res)=>success(res,await updateProfile(req.user,req.validated.body),'Profile updated'),
    changePassword:async (req,res)=>{
      if (env) clearRefreshCookie(res, env);
      return success(res,await changePassword(req.user,req.validated.body),'Password changed. Sign in again');
    }
  };
}

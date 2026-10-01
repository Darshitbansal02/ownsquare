import {userDTO} from '../utils/dto.js';
import {setRefreshCookie, clearRefreshCookie, getRefreshCookie} from '../utils/refreshCookie.js';
export const success = (res,data,message,status=200) => res.status(status).json({success:true,data,message});
export function authController(service, env) {
  return {
    register:async (req,res)=>{
      const result = await service.register(req.validated.body);
      const {_refreshRaw, ...data} = result;
      if (_refreshRaw && env) setRefreshCookie(res, _refreshRaw, env);
      return success(res,data,'Account created',201);
    },
    login:async (req,res)=>{
      const result = await service.login(req.validated.body);
      const {_refreshRaw, ...data} = result;
      if (_refreshRaw && env) setRefreshCookie(res, _refreshRaw, env);
      return success(res,data,'Logged in');
    },
    refresh:async (req,res)=>{
      const currentToken = getRefreshCookie(req);
      try {
        const result = await service.refresh(currentToken);
        const {_refreshRaw, ...data} = result;
        if (_refreshRaw && env) setRefreshCookie(res, _refreshRaw, env);
        return success(res,data,'Token refreshed');
      } catch (err) {
        if (env) clearRefreshCookie(res, env);
        throw err;
      }
    },
    logout:async (req,res)=>{
      const currentToken = getRefreshCookie(req);
      if (env) clearRefreshCookie(res, env);
      return success(res,await service.logout(req.user, currentToken),'Logged out');
    },
    me:async (req,res)=>success(res,userDTO(req.user),'Current user'),
    forgotPassword:async (req,res)=>success(res,await service.forgotPassword(req.validated.body),'If an active account exists, a reset email has been requested'),
    resetPassword:async (req,res)=>{
      if (env) clearRefreshCookie(res, env);
      return success(res,await service.resetPassword(req.validated.params.token,req.validated.body),'Password reset. Sign in again');
    }
  };
}

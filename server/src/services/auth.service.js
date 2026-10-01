import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import { userDTO } from '../utils/dto.js';
import ApiError from '../utils/ApiError.js';
import { issueRefreshToken, rotateRefreshToken, revokeAllRefreshTokens, revokeRefreshToken } from './refreshToken.service.js';

const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');
export function createAuthService(env, mailer) {
  const transport = mailer ?? (env.PASSWORD_RESET_ENABLED ? nodemailer.createTransport({host:env.SMTP_HOST,port:env.SMTP_PORT,secure:env.SMTP_SECURE,auth:{user:env.SMTP_USER,pass:env.SMTP_PASS}}) : null);
  const accessToken = user => jwt.sign({role:user.role,sessionVersion:user.sessionVersion},env.JWT_SECRET,{subject:String(user._id),expiresIn:900,algorithm:'HS256',issuer:'ownsquare',audience:'ownsquare-web'});
  const result = async user => {
    const token = accessToken(user);
    const refresh = await issueRefreshToken(user._id, user.sessionVersion);
    return { user: userDTO(user), accessToken: token, expiresIn: 900, _refreshRaw: refresh.raw };
  };
  return {
    async register(body) {
      const passwordHash = await bcrypt.hash(body.password,12);
      const user = await User.create({name:body.name,email:body.email,phone:body.phone,role:body.role,passwordHash});
      return result(user);
    },
    async login(body) {
      const user = await User.findOne({email:body.email}).select('+passwordHash');
      // A real bcrypt comparison also runs for unknown emails to reduce account timing disclosure.
      const valid = await bcrypt.compare(body.password,user?.passwordHash ?? '$2b$12$C6UzMDM.H6dfI/f/IKcEe.3KcRK89pEeC3S75LDDmSjULvh6xXP1e');
      if (!user || !valid) throw new ApiError('INVALID_CREDENTIALS','Email or password is incorrect');
      if (!user.isActive) throw new ApiError('UNAUTHORIZED','This account is inactive');
      return result(user);
    },
    async logout(user, currentRefreshToken) {
      if (currentRefreshToken) await revokeRefreshToken(currentRefreshToken);
      if (user) {
        await User.updateOne({_id:user._id},{$inc:{sessionVersion:1}});
        await revokeAllRefreshTokens(user._id);
      }
      return {loggedOut:true};
    },
    async refresh(rawToken) {
      if (!rawToken) throw new ApiError('UNAUTHORIZED','Refresh token is required');
      const rotated = await rotateRefreshToken(rawToken);
      if (!rotated) throw new ApiError('UNAUTHORIZED','Refresh token is invalid, expired, or reused');
      // Verify the user is still active and sessionVersion matches.
      const user = await User.findById(rotated.userId);
      if (!user?.isActive || user.sessionVersion !== rotated.sessionVersion) {
        // User deactivated or password changed since refresh was issued; revoke family.
        await revokeAllRefreshTokens(rotated.userId);
        throw new ApiError('UNAUTHORIZED','Your session has been revoked');
      }
      const token = accessToken(user);
      return { user: userDTO(user), accessToken: token, expiresIn: 900, _refreshRaw: rotated.raw };
    },
    async forgotPassword({email}) {
      if (!env.PASSWORD_RESET_ENABLED) throw new ApiError('FEATURE_DISABLED','Password reset is unavailable');
      const token = crypto.randomBytes(32).toString('hex'); const tokenHash = hashToken(token);
      const user = await User.findOneAndUpdate({email,isActive:true},{$set:{resetTokenHash:tokenHash,resetTokenExpiresAt:new Date(Date.now()+30*60*1000)}},{returnDocument:'after'});
      if (user) {
        try { await transport.sendMail({from:env.MAIL_FROM,to:user.email,subject:'Reset your OwnSquare password',text:`Reset your password within 30 minutes: ${env.CLIENT_URL}/reset/${token}`}); }
        catch { await User.updateOne({_id:user._id,resetTokenHash:tokenHash},{$set:{resetTokenHash:null,resetTokenExpiresAt:null}}); throw new ApiError('SERVICE_UNAVAILABLE','Password reset email is unavailable'); }
      }
      return {requested:true};
    },
    async resetPassword(token,{password}) {
      if (!env.PASSWORD_RESET_ENABLED) throw new ApiError('FEATURE_DISABLED','Password reset is unavailable');
      const passwordHash = await bcrypt.hash(password,12);
      const user = await User.findOneAndUpdate({resetTokenHash:hashToken(token),resetTokenExpiresAt:{$gt:new Date()},isActive:true},{$set:{passwordHash,resetTokenHash:null,resetTokenExpiresAt:null},$inc:{sessionVersion:1}},{returnDocument:'after'});
      if (!user) throw new ApiError('INVALID_RESET_TOKEN','Reset link is invalid, expired, or already used');
      // Revoke all refresh tokens on password reset.
      await revokeAllRefreshTokens(user._id);
      return {reset:true};
    }
  };
}

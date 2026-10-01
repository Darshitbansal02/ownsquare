import { z } from 'zod';
const flag = fallback => z.enum(['true','false']).default(fallback).transform(v=>v==='true');
const schema = z.object({NODE_ENV:z.enum(['development','test','production']).default('development'),PORT:z.coerce.number().int().min(1).max(65535).default(5000),MONGO_URI:z.string().min(1),JWT_SECRET:z.string().min(32),JWT_EXPIRES_IN:z.literal('15m').default('15m'),CLIENT_URL:z.url().default('http://localhost:5173'),ENQUIRIES_ENABLED:flag('true'),NOTIFICATIONS_ENABLED:flag('true'),PASSWORD_RESET_ENABLED:flag('false'),SMTP_HOST:z.string().optional(),SMTP_PORT:z.coerce.number().int().min(1).max(65535).default(587),SMTP_SECURE:flag('false'),SMTP_USER:z.string().optional(),SMTP_PASS:z.string().optional(),MAIL_FROM:z.string().optional(),CLOUDINARY_CLOUD_NAME:z.string().optional(),CLOUDINARY_API_KEY:z.string().optional(),CLOUDINARY_API_SECRET:z.string().optional()});
export function readEnv(source = process.env) {
  const financial=z.object({PAYMENT_PROVIDER:z.literal('mock').default('mock'),MOCK_PAYMENT_SECRET:z.string().min(32),KYC_ENABLED:flag('true'),WITHDRAWALS_ENABLED:flag('true'),OWNERSHIP_CAP_ENABLED:flag('true'),PLATFORM_FEE_PCT:z.coerce.number().min(0).max(100).default(2),BROKER_COMMISSION_PCT:z.coerce.number().min(0).max(100).default(1),MAX_OWNERSHIP_PCT:z.coerce.number().positive().max(100).default(49)}).parse(source);
  const env = {...schema.parse(source),...financial};
  if(env.MOCK_PAYMENT_SECRET===env.JWT_SECRET||new Set(env.MOCK_PAYMENT_SECRET).size<10)throw new Error('Generate a separate strong MOCK_PAYMENT_SECRET');
  for(const key of ['PLATFORM_FEE_PCT','BROKER_COMMISSION_PCT','MAX_OWNERSHIP_PCT'])if(!/^\d+(\.\d{1,2})?$/.test(String(env[key])))throw new Error('Seed rates require at most two decimals');
  if (['change_me','secret'].includes(env.JWT_SECRET) || !/[a-zA-Z]/.test(env.JWT_SECRET) || new Set(env.JWT_SECRET).size < 10) throw new Error('Generate a strong JWT_SECRET');
  const origin = new URL(env.CLIENT_URL);
  if (origin.origin !== env.CLIENT_URL || (env.NODE_ENV === 'production' && origin.protocol !== 'https:')) throw new Error('CLIENT_URL must be an exact origin (HTTPS in production)');
  if (env.PASSWORD_RESET_ENABLED && !['SMTP_HOST','SMTP_USER','SMTP_PASS','MAIL_FROM'].every(k=>env[k])) throw new Error('Password reset requires SMTP configuration');
  return env;
}

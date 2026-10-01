import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import {readEnv} from '../src/config/env.js';
import {connectDB} from '../src/config/db.js';
import User from '../src/models/User.js';
import {password} from '../src/validators/auth.schema.js';
try {
  const env=readEnv();if(env.NODE_ENV==='production')throw new Error('Auth demo seed refuses production');
  const credentials=[['admin@demo.com','Demo Admin','ADMIN','SEED_ADMIN_PASSWORD',false],['rohit@demo.com','Rohit Broker','BROKER','SEED_BROKER_PASSWORD',true],['other-broker@demo.com','Second Broker','BROKER','SEED_BROKER_PASSWORD',true],['aman@demo.com','Aman Investor','INVESTOR','SEED_INVESTOR_PASSWORD',false]];
  for(const fixture of credentials)password.parse(process.env[fixture[3]]);
  await connectDB(env.MONGO_URI);await User.init();
  for(const [email,name,role,key,brokerApproved] of credentials) {
    const existing=await User.findOne({email});if(existing){if(existing.role!==role)throw new Error('A fixture email belongs to a different role');console.log(`Preserved existing ${role} fixture`);continue;}
    await User.create({email,name,role,phone:'0000000000',brokerApproved,passwordHash:await bcrypt.hash(process.env[key],12)});console.log(`Created ${role} fixture`);
  }
}catch(error){console.error(error.name==='ZodError' ? 'Supply strong seed passwords and required environment configuration' : error.message);process.exitCode=1;}finally{await mongoose.disconnect();}

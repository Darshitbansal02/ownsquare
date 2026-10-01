import mongoose from 'mongoose';
import {readEnv} from './config/env.js';
import {connectDB} from './config/db.js';
import {createApp} from './app.js';
try {
  const env=readEnv();await connectDB(env.MONGO_URI);
  await Promise.all(Object.values(mongoose.models).map(model=>model.init()));
  const server=createApp(env).listen(env.PORT,()=>console.log(`OwnSquare API listening on port ${env.PORT}`));
  const stop=()=>server.close(async()=>{await mongoose.disconnect();process.exit(0);});process.on('SIGINT',stop);process.on('SIGTERM',stop);
} catch(error) {console.error('Startup failed:',error.name==='ZodError' ? 'Check required environment configuration' : error.message);process.exitCode=1;}

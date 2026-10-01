import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'VITE_');
  if(!env.VITE_API_BASE_URL)throw new Error('Set VITE_API_BASE_URL in client/.env (copy .env.example first)');
  const url=new URL(env.VITE_API_BASE_URL);
  if(!['http:','https:'].includes(url.protocol) || !url.pathname.endsWith('/api/v1'))throw new Error('VITE_API_BASE_URL must be an HTTP(S) URL ending in /api/v1');
  return {plugins:[react()],server:{host:'127.0.0.1'}};
});

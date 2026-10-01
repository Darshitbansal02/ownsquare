import crypto from 'node:crypto';
import ApiError from '../utils/ApiError.js';
import {configureCloudinary} from '../config/cloudinary.js';
export function fileType(buffer) {
  if(buffer.length>=3 && buffer.subarray(0,3).equals(Buffer.from([255,216,255]))) return 'image/jpeg';
  if(buffer.length>=8 && buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if(buffer.length>=12 && buffer.subarray(0,4).toString()==='RIFF' && buffer.subarray(8,12).toString()==='WEBP') return 'image/webp';
  if(buffer.length>=5 && buffer.subarray(0,5).toString()==='%PDF-') return 'application/pdf';
  return null;
}
export function createUploadService(env) {
  const cloudinary=configureCloudinary(env);
  const ready=()=>{if(!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) throw new ApiError('SERVICE_UNAVAILABLE','Configure Cloudinary to upload or attach media');};
  const privateMedia=async asset=>{ready();let resource;try{resource=await cloudinary.api.resource(asset.publicId,{resource_type:'image',type:'authenticated',context:true});}catch{throw new ApiError('SERVICE_UNAVAILABLE','Private media delivery is unavailable');}return {publicId:asset.publicId,name:asset.name,url:cloudinary.utils.private_download_url(asset.publicId,resource.format,{type:'authenticated',resource_type:'image',attachment:false,expires_at:Math.floor(Date.now()/1000)+600})};};
  return {
    privateMedia,
    async verifyKyc(body,user){
      ready();const verified=[];
      for(const asset of [...body.docs,body.selfie]){
        let resource;try{resource=await cloudinary.api.resource(asset.publicId,{resource_type:'image',type:'authenticated',context:true});}catch(error){if(error.http_code===404||error.error?.http_code===404)throw new ApiError('VALIDATION_ERROR','KYC media was not uploaded through OwnSquare');throw new ApiError('SERVICE_UNAVAILABLE','KYC media verification is unavailable');}
        if(resource.context?.custom?.ownerId!==String(user._id)||resource.context?.custom?.purpose!=='kyc'||resource.bytes>5*1024*1024||!['jpg','jpeg','png','webp','pdf'].includes(resource.format))throw new ApiError('VALIDATION_ERROR','Use your own private dummy KYC uploads');
        if(asset===body.selfie&&resource.format==='pdf')throw new ApiError('VALIDATION_ERROR','Selfie must be an image');
        verified.push({publicId:resource.public_id,url:resource.secure_url,name:asset.name});
      }
      return {docs:verified.slice(0,-1),selfie:verified.at(-1)};
    },
    async upload(file,user,purpose='property') {
      if(!file) throw new ApiError('VALIDATION_ERROR','Select a file');
      if(fileType(file.buffer)!==file.mimetype || !fileType(file.buffer)) throw new ApiError('UNSUPPORTED_MEDIA_TYPE','Upload a valid jpg, png, webp, or PDF matching its MIME type');
      ready();
      try {
        const result=await new Promise((resolve,reject)=>cloudinary.uploader.upload_stream({resource_type:'image',type:purpose==='kyc'?'authenticated':'upload',public_id:`ownsquare/${purpose}/${user._id}/${crypto.randomUUID()}`,context:{ownerId:String(user._id),purpose}},(error,result)=>error ? reject(error) : resolve(result)).end(file.buffer));
        const asset={url:result.secure_url,publicId:result.public_id,name:[...file.originalname].filter(c=>c.charCodeAt(0)>=32 && !['/','\\'].includes(c)).join('').slice(0,200)||'Media'};
        return purpose==='kyc'?privateMedia(asset):asset;
      } catch { throw new ApiError('SERVICE_UNAVAILABLE','Media upload failed. Try again'); }
    },
    async verifyMedia(body,user) {
      const assets=[...(body.images??[]),...(body.documents??[])];if(!assets.length)return;
      ready();
      for(const asset of assets) {
        let resource;
        try {resource=await cloudinary.api.resource(asset.publicId,{resource_type:'image',type:'upload',context:true});}
        catch(error) {if(error.http_code===404 || error.error?.http_code===404) throw new ApiError('VALIDATION_ERROR','Media was not uploaded through OwnSquare');throw new ApiError('SERVICE_UNAVAILABLE','Media verification is unavailable');}
        const context=resource.context?.custom;
        if(context?.ownerId!==String(user._id) || context?.purpose!=='property' || resource.secure_url!==asset.url || resource.bytes>5*1024*1024 || !['jpg','jpeg','png','webp','pdf'].includes(resource.format)) throw new ApiError('VALIDATION_ERROR','Media must be your verified property upload');
        if((body.images??[]).some(image=>image.publicId===asset.publicId) && resource.format==='pdf') throw new ApiError('VALIDATION_ERROR','Property images must be images');
      }
    }
  };
}

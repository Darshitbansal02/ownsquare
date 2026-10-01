import Settings from '../models/Settings.js';
import ApiError from '../utils/ApiError.js';
export async function settings(session) {const result=await Settings.findOne({singletonKey:'platform'}).session(session??null);if(!result)throw new ApiError('SERVICE_UNAVAILABLE','Platform settings are missing. Run the demo seed');return result;}
export const settingsDTO=s=>({platformFeePct:s.platformFeePct,brokerCommissionPct:s.brokerCommissionPct,maxOwnershipPct:s.maxOwnershipPct});

import Property from '../models/Property.js';
import { ROLES } from '../../../shared/constants.js';
import ApiError from '../utils/ApiError.js';
export const propertyScope = user => user.role === ROLES.ADMIN ? {} : {brokerId:user._id};
export async function requireOwnership(req,res,next) {
  const property = await Property.findOne({_id:req.validated.params.id,...propertyScope(req.user)});
  if (!property) throw new ApiError('NOT_FOUND','Property not found');
  req.property = property; next();
}

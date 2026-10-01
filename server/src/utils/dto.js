export const userDTO = u => ({ _id:String(u._id), name:u.name, email:u.email, phone:u.phone, role:u.role, isActive:u.isActive, brokerApproved:u.brokerApproved, kyc:{status:u.kyc.status,reason:u.kyc.reason ?? null}, createdAt:u.createdAt, updatedAt:u.updatedAt });
export function propertyDTO(p, investorCount = 0) {
  const { version, __v, ...data } = p.toObject ? p.toObject() : p;
  void version; void __v;
  return {...data, _id:String(p._id), brokerId:p.brokerId ? String(p.brokerId) : null, createdBy:String(p.createdBy), approvedBy:p.approvedBy ? String(p.approvedBy) : null, fundingPct:p.totalUnits ? p.unitsSold / p.totalUnits * 100 : 0, remainingUnits:p.totalUnits ? p.totalUnits - p.unitsSold : 0, investorCount};
}
export const pageDTO = (items, total, {page,limit}) => ({items,page,limit,total,totalPages:Math.ceil(total/limit)});
export const transactionDTO=t=>({_id:String(t._id),userId:String(t.userId),type:t.type,direction:t.direction,amount:t.amount,balanceAfter:t.balanceAfter,refType:t.refType,refId:t.refId,...(t.gatewayOrderId&&{gatewayOrderId:t.gatewayOrderId}),...(t.gatewayPaymentId&&{gatewayPaymentId:t.gatewayPaymentId}),createdAt:t.createdAt});
export const sortSpec = sort => ({[sort.replace(/^-/, '')]:sort.startsWith('-') ? -1 : 1, _id:sort.startsWith('-') ? -1 : 1});
export const literalSearch = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

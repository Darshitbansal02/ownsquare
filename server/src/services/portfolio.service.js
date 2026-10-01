import Investment from '../models/Investment.js';
import Property from '../models/Property.js';
import {inTransaction} from '../utils/transaction.js';
import {walletState,walletDTO} from './ledger.service.js';
import {safeMoney} from '../utils/money.js';
import {propertyDTO} from '../utils/dto.js';
export const portfolioSummary=userId=>inTransaction(async session=>{
  const rows=await Investment.find({investorId:userId}).sort({createdAt:1,_id:1}).session(session),groups=new Map();
  for(const row of rows){const id=String(row.propertyId);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(row);}
  const holdings=[],allocation=[];let totalInvested=0n,currentValue=0n,totalPayouts=0n;
  for(const [id,investments] of groups){
    const p=await Property.findById(id).session(session);
    const sum=field=>safeMoney(investments.reduce((s,i)=>s+BigInt(i[field]),0n));
    const units=sum('units'),invested=sum('amount'),payoutAmount=sum('payoutAmount'),status=investments[0].status;
    const years=Math.max(0,(Date.now()-new Date(p.liveAt))/ (365.25*86400000));
    const estimatedValue=status==='ACTIVE'?safeMoney(Math.round(invested*(1+p.expectedAppreciationPct/100)**years)):status==='EXITED'?payoutAmount:invested;
    const count=await Investment.distinct('investorId',{propertyId:p._id,status:{$ne:'REFUNDED'}}).session(session);
    holdings.push({property:propertyDTO(p,count.length),units,ownershipPct:units/p.totalUnits*100,invested,estimatedValue,payoutAmount,status,roiPct:invested?(estimatedValue-invested)/invested*100:null});
    if(status==='ACTIVE')allocation.push({propertyId:id,title:p.title,amount:invested});
    totalInvested+=BigInt(invested);currentValue+=BigInt(estimatedValue);totalPayouts+=BigInt(payoutAmount);
  }
  return {totalInvested:safeMoney(totalInvested),currentValue:safeMoney(currentValue),totalPayouts:safeMoney(totalPayouts),overallRoiPct:totalInvested?Number(currentValue-totalInvested)/Number(totalInvested)*100:null,wallet:walletDTO(await walletState(userId,session)),holdings,allocation};
});

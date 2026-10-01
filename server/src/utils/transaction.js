import mongoose from 'mongoose';
import ApiError from './ApiError.js';
import {setTimeout as delay} from 'node:timers/promises';
export async function inTransaction(work) {
  const session=await mongoose.startSession();
  try {
    for(let attempt=0;attempt<5;attempt++) {
      session.startTransaction({readConcern:{level:'snapshot'},writeConcern:{w:'majority'}});
      try {
        const result=await work(session);
        for(let commit=0;;commit++) {
          try {await session.commitTransaction();break;}
          catch(error){if(!error.hasErrorLabel?.('UnknownTransactionCommitResult') || commit>=2)throw error;}
        }
        return result;
      } catch(error) {
        if(session.inTransaction())await session.abortTransaction();
        if(!error.hasErrorLabel?.('TransientTransactionError'))throw error;
        if(attempt===4)throw new ApiError('CONFLICT','Concurrent change. Retry the same request');
        await delay(25*2**attempt);
      }
    }
  } finally {await session.endSession();}
}

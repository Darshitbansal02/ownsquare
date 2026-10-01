import mongoose from 'mongoose';
export async function connectDB(uri) {
  await mongoose.connect(uri, {serverSelectionTimeoutMS:5000});
  const hello = await mongoose.connection.db.admin().command({hello:1});
  if (!hello.setName && hello.msg !== 'isdbgrid') { await mongoose.disconnect(); throw new Error('A MongoDB replica set is required'); }
}

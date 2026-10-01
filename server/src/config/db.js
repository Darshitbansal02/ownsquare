import mongoose from "mongoose";
import { getModels } from "../models/index.js";
import { ApiError } from "../utils/ApiError.js";

export async function connectDatabase(uri) {
  if (typeof uri !== "string" || !uri.startsWith("mongodb")) throw new ApiError("SERVICE_UNAVAILABLE", "MongoDB configuration is required");
  const connection = mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 10000, autoIndex: false, maxPoolSize: 20
  });
  try {
    await connection.asPromise();
    const hello = await connection.db.admin().command({ hello: 1 });
    if ((!hello.setName && hello.msg !== "isdbgrid") || !hello.logicalSessionTimeoutMinutes) {
      throw new ApiError("SERVICE_UNAVAILABLE", "Transaction-capable MongoDB is required");
    }
    const models = getModels(connection);
    for (const model of Object.values(models)) {
      await model.createCollection();
      await model.createIndexes();
    }
    return { connection, models };
  } catch (error) {
    await connection.close();
    if (error instanceof ApiError) throw error;
    throw new ApiError("SERVICE_UNAVAILABLE", "Database readiness failed", [], { cause: error });
  }
}

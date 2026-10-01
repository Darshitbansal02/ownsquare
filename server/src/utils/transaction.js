import { ApiError } from "./ApiError.js";

const databaseFailures = new Set([
  "MongoNetworkError", "MongoNetworkTimeoutError", "MongoServerSelectionError",
  "MongooseServerSelectionError", "MongoNotConnectedError", "MongoTopologyClosedError",
  "MongoOperationTimeoutError"
]);
export const isDatabaseUnavailable = (error) => databaseFailures.has(error.name);

export function requireSession(session) {
  if (!session?.inTransaction()) throw new ApiError("INTERNAL_ERROR", "An active transaction is required");
}

export async function inTransaction(connection, work, { attempts = 5 } = {}) {
  if (connection.readyState !== 1) throw new ApiError("SERVICE_UNAVAILABLE", "Database is not connected");
  const session = await connection.startSession();
  try {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      session.startTransaction({ readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
      try {
        const result = await work(session, attempt);
        for (let commitAttempt = 0; commitAttempt < attempts; commitAttempt += 1) {
          try {
            await session.commitTransaction();
            return result;
          } catch (error) {
            if (!error.hasErrorLabel?.("UnknownTransactionCommitResult")) throw error;
            if (commitAttempt === attempts - 1) {
              throw new ApiError("SERVICE_UNAVAILABLE", "Transaction outcome is uncertain; reconcile before retrying", [], { cause: error });
            }
          }
        }
      } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        if (!error.hasErrorLabel?.("TransientTransactionError")) throw error;
        if (attempt === attempts - 1) {
          if (isDatabaseUnavailable(error)) throw new ApiError("SERVICE_UNAVAILABLE", "Database operation unavailable", [], { cause: error });
          throw new ApiError("CONFLICT", "Concurrent operation; retry the request", [], { cause: error });
        }
        await new Promise((resolve) => setTimeout(resolve, 10 * (attempt + 1)));
      }
    }
    throw new ApiError("INTERNAL_ERROR", "Transaction did not complete");
  } finally {
    await session.endSession();
  }
}

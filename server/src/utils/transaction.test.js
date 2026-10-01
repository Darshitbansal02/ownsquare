import { describe, expect, it, vi } from "vitest";
import { ApiError } from "./ApiError.js";
import { inTransaction } from "./transaction.js";
import { protectedRouter } from "./http.js";

function driverFixture() {
  const session = {
    startTransaction: vi.fn(), commitTransaction: vi.fn(), abortTransaction: vi.fn(),
    endSession: vi.fn(), inTransaction: () => true
  };
  return { session, connection: { startSession: async () => session } };
}
const labelled = (label) => Object.assign(new Error(label), { hasErrorLabel: (value) => value === label });

describe("transaction driver policy (unit only, not database evidence)", () => {
  it("retries transient work but not business failures", async () => {
    const { session, connection } = driverFixture();
    const work = vi.fn().mockRejectedValueOnce(labelled("TransientTransactionError")).mockResolvedValue(7);
    expect(await inTransaction(connection, work)).toBe(7);
    expect(work).toHaveBeenCalledTimes(2);
    expect(session.endSession).toHaveBeenCalledOnce();
    const business = vi.fn().mockRejectedValue(new ApiError("INSUFFICIENT_BALANCE", "Shortfall"));
    await expect(inTransaction(connection, business)).rejects.toMatchObject({ code: "INSUFFICIENT_BALANCE" });
    expect(business).toHaveBeenCalledOnce();
  });
  it("retries an uncertain commit without re-executing money writes", async () => {
    const { session, connection } = driverFixture();
    session.commitTransaction.mockRejectedValueOnce(labelled("UnknownTransactionCommitResult"));
    const work = vi.fn().mockResolvedValue("committed");
    expect(await inTransaction(connection, work)).toBe("committed");
    expect(work).toHaveBeenCalledOnce();
    expect(session.commitTransaction).toHaveBeenCalledTimes(2);
  });
  it("bounds transient attempts and refuses placeholder router authentication", async () => {
    const { connection } = driverFixture();
    const work = vi.fn().mockRejectedValue(labelled("TransientTransactionError"));
    await expect(inTransaction(connection, work, { attempts: 2 })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(work).toHaveBeenCalledTimes(2);
    expect(() => protectedRouter(undefined, undefined, ["INVESTOR"])).toThrow("Real authenticate");
  });
});

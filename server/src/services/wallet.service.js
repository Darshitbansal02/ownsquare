import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { requireActor } from "../utils/actors.js";
import { integer } from "../utils/money.js";
import { inTransaction } from "../utils/transaction.js";
import { transactionDTO } from "../utils/dto.js";
import { objectId, positiveInteger } from "../validators/common.schema.js";

const proofSchema = z.object({
  userId: objectId, gatewayOrderId: z.string().regex(/^mock_order_[0-9a-f-]{36}$/),
  gatewayPaymentId: z.string().regex(/^mock_payment_[0-9a-f-]{36}$/),
  amount: positiveInteger, currency: z.literal("INR"), expiresAt: positiveInteger
}).strict();

export function createWalletService({ connection, models, ledger, payment }) {
  if (payment?.provider !== "mock" || typeof payment.secret !== "string" || payment.secret.length < 32) {
    throw new ApiError("SERVICE_UNAVAILABLE", "A configured signed mock payment provider is required");
  }
  const sign = (payload) => createHmac("sha256", payment.secret).update(payload).digest("base64url");
  async function get(userId) {
    return inTransaction(connection, async (session) => {
      await requireActor(models, userId, ["INVESTOR"], session);
      return ledger.read(userId, session);
    });
  }
  async function order(userId, amount) {
    await requireActor(models, userId, ["INVESTOR"]);
    integer(amount, "amount", 1);
    const proof = {
      userId: String(userId), gatewayOrderId: `mock_order_${randomUUID()}`,
      gatewayPaymentId: `mock_payment_${randomUUID()}`, amount, currency: "INR", expiresAt: Date.now() + 600000
    };
    const encoded = Buffer.from(JSON.stringify(proof)).toString("base64url");
    return {
      gatewayOrderId: proof.gatewayOrderId, amount, currency: "INR", provider: "mock",
      checkout: { gatewayPaymentId: proof.gatewayPaymentId, mockOrderToken: `${encoded}.${sign(encoded)}` }
    };
  }
  function verifyProof(userId, input) {
    try {
      if (typeof input.mockOrderToken !== "string" || input.mockOrderToken.length > 2048) throw new Error("Invalid proof");
      const parts = input.mockOrderToken.split(".");
      if (parts.length !== 2) throw new Error("Invalid proof");
      const [payload, signature] = parts;
      const actual = Buffer.from(signature, "base64url");
      const expected = Buffer.from(sign(payload), "base64url");
      if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("Invalid signature");
      const proof = proofSchema.parse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
      if (proof.userId !== String(userId) || proof.gatewayOrderId !== input.gatewayOrderId ||
          proof.gatewayPaymentId !== input.gatewayPaymentId || proof.expiresAt <= Date.now()) throw new Error("Invalid binding");
      return proof;
    } catch (error) {
      throw new ApiError("PAYMENT_VERIFICATION_FAILED", "Payment proof is invalid or expired", [], { cause: error });
    }
  }
  async function verify(userId, input) {
    await requireActor(models, userId, ["INVESTOR"]);
    const proof = verifyProof(userId, input);
    try {
      return await inTransaction(connection, async (session) => {
        await requireActor(models, userId, ["INVESTOR"], session);
        verifyProof(userId, input);
        if (await models.Transaction.exists({ $or: [{ gatewayOrderId: proof.gatewayOrderId }, { gatewayPaymentId: proof.gatewayPaymentId }] }).session(session)) {
          throw new ApiError("DUPLICATE_PAYMENT", "Payment has already been credited");
        }
        const transaction = await ledger.post({
          userId, type: "TOPUP", direction: "CREDIT", amount: proof.amount,
          refType: "TopupOrder", refId: proof.gatewayOrderId,
          gatewayOrderId: proof.gatewayOrderId, gatewayPaymentId: proof.gatewayPaymentId
        }, session);
        return { wallet: await ledger.read(userId, session), transaction: transactionDTO(transaction) };
      });
    } catch (error) {
      if (error.code === 11000 && (error.keyPattern?.gatewayOrderId || error.keyPattern?.gatewayPaymentId)) {
        throw new ApiError("DUPLICATE_PAYMENT", "Payment has already been credited");
      }
      throw error;
    }
  }
  return { get, order, verify };
}

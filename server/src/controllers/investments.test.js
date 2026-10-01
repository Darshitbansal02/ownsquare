import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createInvestmentsController } from "./investments.controller.js";

describe("investment transport mapping only", () => {
  it("maps committed creation to 201 and original replay to 200 with exact envelopes", async () => {
    const snapshot = { investment: { _id: "fixture" }, property: { status: "LIVE" }, walletBalance: 0 };
    const investments = { invest: vi.fn().mockResolvedValueOnce({ data: snapshot, replay: false })
      .mockResolvedValueOnce({ data: snapshot, replay: true }) };
    const controller = createInvestmentsController({ investments });
    const key = randomUUID();
    const req = { user: { _id: "actor" }, validated: { body: { propertyId: "property", units: 1 } }, get: () => key };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await controller.create(req, res);
    await controller.create(req, res);
    expect(res.status.mock.calls).toEqual([[201], [200]]);
    expect(res.json.mock.calls).toEqual([
      [{ success: true, data: snapshot, message: "Investment confirmed" }],
      [{ success: true, data: snapshot, message: "Investment confirmed" }]
    ]);
  });
});

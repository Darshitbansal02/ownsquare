import express from "express";
import { protectedRouter, send } from "../utils/http.js";

export function createBrokerRouter({ services, authenticate, requireRole, models }) {
  const router = protectedRouter(authenticate, requireRole, ["BROKER", "ADMIN"]);

  // GET /api/v1/broker/properties
  router.get("/properties", async (req, res, next) => {
    try {
      const brokerId = req.user._id;
      const query = { ...req.query, brokerId };
      const result = await services.admin.allProperties(query);

      // Compute stats for broker dashboard
      const [listedCount, liveCount, fundedCount, raisedAgg, commissionAgg, series] = await Promise.all([
        models.Property.countDocuments({ brokerId }),
        models.Property.countDocuments({ brokerId, status: "LIVE" }),
        models.Property.countDocuments({ brokerId, status: { $in: ["FUNDED", "HOLDING", "SOLD"] } }),
        models.Property.aggregate([
          { $match: { brokerId } },
          { $project: { totalRaised: { $multiply: ["$unitsSold", "$unitPrice"] } } },
          { $group: { _id: null, total: { $sum: "$totalRaised" } } }
        ]),
        models.Transaction.aggregate([
          { $match: { userId: brokerId, type: "COMMISSION" } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]),
        models.Transaction.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 30 * 86400000) },
              type: "INVESTMENT"
            }
          },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, amount: { $sum: "$amount" } } },
          { $sort: { _id: 1 } }
        ])
      ]);

      const stats = {
        propertiesListed: listedCount,
        liveProperties: liveCount,
        fundedProperties: fundedCount,
        totalRaised: raisedAgg[0]?.total ?? 0,
        commissionEarned: commissionAgg[0]?.total ?? 0
      };

      const fundingSeries = series.map((row) => ({ date: row._id, amount: row.amount }));

      return send(res, { ...result, stats, fundingSeries }, "Broker properties retrieved");
    } catch (err) {
      next(err);
    }
  });

  return router;
}

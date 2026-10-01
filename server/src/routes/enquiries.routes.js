import express from "express";
import { send } from "../utils/http.js";
import { ApiError } from "../utils/ApiError.js";

export function createEnquiriesRouter({ models, authenticate }) {
  const router = express.Router();
  router.use(authenticate);

  // GET /api/v1/enquiries
  router.get("/", async (req, res, next) => {
    try {
      const userId = req.user._id;
      const enquiries = await models.Enquiry.find({
        $or: [{ investorId: userId }, { brokerId: userId }]
      })
        .populate("propertyId", "title city")
        .populate("investorId", "name email")
        .populate("brokerId", "name email")
        .sort({ updatedAt: -1 })
        .lean();

      return send(res, { items: enquiries, total: enquiries.length }, "Enquiries retrieved");
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/enquiries
  router.post("/", async (req, res, next) => {
    try {
      const { propertyId, message } = req.body;
      if (!propertyId || !message?.trim()) {
        throw new ApiError("VALIDATION_ERROR", "Property ID and message are required");
      }

      const property = await models.Property.findById(propertyId);
      if (!property) throw new ApiError("NOT_FOUND", "Property not found");

      let enquiry = await models.Enquiry.findOne({
        propertyId,
        investorId: req.user._id
      });

      const newMessage = {
        from: req.user._id,
        text: message.trim(),
        at: new Date()
      };

      if (enquiry) {
        enquiry.messages.push(newMessage);
        enquiry.status = "OPEN";
        await enquiry.save();
      } else {
        enquiry = await models.Enquiry.create({
          propertyId,
          investorId: req.user._id,
          brokerId: property.brokerId || property.createdBy,
          messages: [newMessage],
          status: "OPEN"
        });
      }

      return send(res, enquiry, "Enquiry submitted", 201);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/v1/enquiries/:id/reply
  router.post("/:id/reply", async (req, res, next) => {
    try {
      const { text } = req.body;
      if (!text?.trim()) throw new ApiError("VALIDATION_ERROR", "Reply message text is required");

      const enquiry = await models.Enquiry.findById(req.params.id);
      if (!enquiry) throw new ApiError("NOT_FOUND", "Enquiry not found");

      enquiry.messages.push({
        from: req.user._id,
        text: text.trim(),
        at: new Date()
      });
      enquiry.status = "OPEN";
      await enquiry.save();

      return send(res, enquiry, "Reply sent");
    } catch (err) {
      next(err);
    }
  });

  return router;
}

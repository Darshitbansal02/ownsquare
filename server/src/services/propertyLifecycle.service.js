import mongoose from 'mongoose';
import { Property, Investment, User, Transaction } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { PROPERTY_STATUS, INVESTMENT_STATUS, TRANSACTION_TYPES, TRANSACTION_DIRECTIONS } from '../../shared/constants.js';
import { ERROR_CODES } from '../../shared/errorCodes.js';

export class PropertyLifecycleService {
  /**
   * POST /properties/:id/approve
   * Admin approves a PENDING_APPROVAL property, transitioning it to LIVE.
   */
  async approve(propertyId, adminId) {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      throw ApiError.badRequest('Invalid property ID', ERROR_CODES.VALIDATION_ERROR);
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      throw ApiError.notFound('Property not found', ERROR_CODES.NOT_FOUND);
    }

    if (property.status !== PROPERTY_STATUS.PENDING_APPROVAL) {
      throw ApiError.conflict('Only properties with PENDING_APPROVAL status can be approved', ERROR_CODES.INVALID_PROPERTY_STATUS);
    }

    property.status = PROPERTY_STATUS.LIVE;
    property.approvedBy = adminId;
    property.liveAt = new Date();
    property.rejectionReason = null;
    await property.save();

    return property;
  }

  /**
   * POST /properties/:id/reject
   * Admin rejects a PENDING_APPROVAL property with mandatory reason.
   */
  async reject(propertyId, reason, adminId) {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      throw ApiError.badRequest('Invalid property ID', ERROR_CODES.VALIDATION_ERROR);
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      throw ApiError.notFound('Property not found', ERROR_CODES.NOT_FOUND);
    }

    if (property.status !== PROPERTY_STATUS.PENDING_APPROVAL) {
      throw ApiError.conflict('Only properties with PENDING_APPROVAL status can be rejected', ERROR_CODES.INVALID_PROPERTY_STATUS);
    }

    property.status = PROPERTY_STATUS.REJECTED;
    property.rejectionReason = reason;
    await property.save();

    return property;
  }

  /**
   * POST /properties/:id/status
   * Handles acquisition (FUNDED -> HOLDING) and cancellation with refunds (LIVE -> CANCELLED).
   */
  async updateStatus(propertyId, targetStatus, adminId) {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      throw ApiError.badRequest('Invalid property ID', ERROR_CODES.VALIDATION_ERROR);
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      throw ApiError.notFound('Property not found', ERROR_CODES.NOT_FOUND);
    }

    if (targetStatus === PROPERTY_STATUS.HOLDING) {
      if (property.status !== PROPERTY_STATUS.FUNDED) {
        throw ApiError.conflict('Only FUNDED properties can transition to HOLDING (acquisition confirmed)', ERROR_CODES.INVALID_PROPERTY_STATUS);
      }

      property.status = PROPERTY_STATUS.HOLDING;
      await property.save();

      return {
        property,
        refundedAmount: 0,
        refundedInvestments: 0
      };
    }

    if (targetStatus === PROPERTY_STATUS.CANCELLED) {
      if (property.status !== PROPERTY_STATUS.LIVE) {
        throw ApiError.conflict('Only LIVE properties can be cancelled with refunds', ERROR_CODES.INVALID_PROPERTY_STATUS);
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const activeInvestments = await Investment.find({
          propertyId: property._id,
          status: INVESTMENT_STATUS.ACTIVE
        }).session(session);

        let totalRefunded = 0;

        for (const inv of activeInvestments) {
          const investor = await User.findById(inv.investorId).session(session);
          if (investor) {
            const balanceAfter = investor.walletBalance + inv.amount;
            investor.walletBalance = balanceAfter;
            investor.walletVersion = (investor.walletVersion || 0) + 1;
            await investor.save({ session });

            await Transaction.create(
              [
                {
                  userId: investor._id,
                  type: TRANSACTION_TYPES.REFUND,
                  direction: TRANSACTION_DIRECTIONS.CREDIT,
                  amount: inv.amount,
                  balanceAfter,
                  walletVersion: investor.walletVersion,
                  refType: 'Investment',
                  refId: inv._id.toString()
                }
              ],
              { session }
            );

            inv.status = INVESTMENT_STATUS.REFUNDED;
            await inv.save({ session });
            totalRefunded += inv.amount;
          }
        }

        property.status = PROPERTY_STATUS.CANCELLED;
        property.unitsSold = 0;
        await property.save({ session });

        await session.commitTransaction();

        return {
          property,
          refundedAmount: totalRefunded,
          refundedInvestments: activeInvestments.length
        };
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    }

    throw ApiError.badRequest('Invalid target status requested', ERROR_CODES.INVALID_PROPERTY_STATUS);
  }
}

export const propertyLifecycleService = new PropertyLifecycleService();

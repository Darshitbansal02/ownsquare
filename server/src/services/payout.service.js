import mongoose from 'mongoose';
import { Property, Investment, Payout, User, Transaction, Settings } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { PROPERTY_STATUS, TRANSACTION_TYPES, TRANSACTION_DIRECTIONS, INVESTMENT_STATUS } from '../../shared/constants.js';
import { ERROR_CODES } from '../../shared/errorCodes.js';

export class PayoutService {
  /**
   * GET /properties/:id/payout-preview
   * Pure, read-only calculation of platform fee, net distributable proceeds, investor allocations and remainder.
   */
  async previewPayout(propertyId, salePrice) {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      throw ApiError.badRequest('Invalid property ID', ERROR_CODES.VALIDATION_ERROR);
    }

    if (!salePrice || salePrice <= 0 || !Number.isInteger(salePrice)) {
      throw ApiError.badRequest('Sale price must be a positive integer in paise', ERROR_CODES.VALIDATION_ERROR);
    }

    const property = await Property.findById(propertyId).lean();
    if (!property) {
      throw ApiError.notFound('Property not found', ERROR_CODES.NOT_FOUND);
    }

    if (property.status === PROPERTY_STATUS.SOLD) {
      throw ApiError.conflict('Property has already been sold', ERROR_CODES.ALREADY_SOLD);
    }

    if (property.status !== PROPERTY_STATUS.HOLDING) {
      throw ApiError.conflict('Payout preview is only permitted for properties in HOLDING status', ERROR_CODES.INVALID_PROPERTY_STATUS);
    }

    const settings = (await Settings.findOne({ singletonKey: 'platform' }).lean()) || { platformFeePct: 2 };
    const platformFeePct = settings.platformFeePct;

    // platformFee = floor(salePrice * feeBasisPoints / 10000)
    const feeBasisPoints = Math.round(platformFeePct * 100);
    const platformFee = Math.floor((salePrice * feeBasisPoints) / 10000);
    const distributable = salePrice - platformFee;

    // Aggregate active investments by investor
    const activeInvestments = await Investment.find({
      propertyId: property._id,
      status: INVESTMENT_STATUS.ACTIVE
    }).lean();

    const investorMap = new Map();
    let totalActiveUnits = 0;

    for (const inv of activeInvestments) {
      const idStr = inv.investorId.toString();
      const current = investorMap.get(idStr) || { investorId: inv.investorId, units: 0 };
      current.units += inv.units;
      investorMap.set(idStr, current);
      totalActiveUnits += inv.units;
    }

    if (totalActiveUnits !== property.totalUnits) {
      throw ApiError.conflict('Total active units do not match property total units', ERROR_CODES.CONFLICT);
    }

    const items = [];
    let allocatedSum = 0;

    // Floor each investor share: floor(distributable * investorUnits / totalUnits)
    for (const entry of investorMap.values()) {
      const share = Math.floor((distributable * entry.units) / property.totalUnits);
      items.push({
        investorId: entry.investorId,
        units: entry.units,
        amount: share
      });
      allocatedSum += share;
    }

    const remainder = distributable - allocatedSum;
    let remainderInvestorId = null;

    if (remainder > 0 && items.length > 0) {
      // Allocate remainder to the largest aggregate holder (tiebreak ascending investorId)
      items.sort((a, b) => {
        if (b.units !== a.units) return b.units - a.units;
        return a.investorId.toString().localeCompare(b.investorId.toString());
      });

      items[0].amount += remainder;
      remainderInvestorId = items[0].investorId;
    }

    return {
      propertyId: property._id,
      salePrice,
      platformFeePct,
      platformFee,
      distributable,
      items,
      totalPayout: distributable,
      remainder,
      remainderInvestorId
    };
  }

  /**
   * POST /properties/:id/sell
   * Executes property sale, assigns payouts atomically, and transitions status to SOLD.
   */
  async executePayout(propertyId, salePrice, expectedPlatformFeePct, adminId) {
    const preview = await this.previewPayout(propertyId, salePrice);

    if (preview.platformFeePct !== expectedPlatformFeePct) {
      throw ApiError.conflict('Platform fee has changed since preview. Please refresh preview and reconfirm.', ERROR_CODES.PREVIEW_STALE);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const property = await Property.findById(propertyId).session(session);
      if (property.status === PROPERTY_STATUS.SOLD) {
        throw ApiError.conflict('Property has already been sold', ERROR_CODES.ALREADY_SOLD);
      }

      if (property.status !== PROPERTY_STATUS.HOLDING) {
        throw ApiError.conflict('Only properties in HOLDING status can be sold', ERROR_CODES.INVALID_PROPERTY_STATUS);
      }

      // 1. Create Payout document
      const payout = await Payout.create(
        [
          {
            propertyId: property._id,
            salePrice,
            platformFeePct: preview.platformFeePct,
            platformFee: preview.platformFee,
            distributable: preview.distributable,
            items: preview.items,
            executedBy: adminId,
            executedAt: new Date()
          }
        ],
        { session }
      );

      // 2. Credit each investor wallet via ledger
      for (const item of preview.items) {
        if (item.amount > 0) {
          const investor = await User.findById(item.investorId).session(session);
          if (investor) {
            const balanceAfter = investor.walletBalance + item.amount;
            investor.walletBalance = balanceAfter;
            investor.walletVersion = (investor.walletVersion || 0) + 1;
            await investor.save({ session });

            await Transaction.create(
              [
                {
                  userId: investor._id,
                  type: TRANSACTION_TYPES.PAYOUT,
                  direction: TRANSACTION_DIRECTIONS.CREDIT,
                  amount: item.amount,
                  balanceAfter,
                  walletVersion: investor.walletVersion,
                  refType: 'Payout',
                  refId: payout[0]._id.toString()
                }
              ],
              { session }
            );
          }
        }
      }

      // 3. Credit platform fee account if fee > 0
      if (preview.platformFee > 0) {
        const settings = await Settings.findOne({ singletonKey: 'platform' }).session(session);
        const feeUserId = settings?.feeAccountUserId || adminId;
        const feeUser = await User.findById(feeUserId).session(session);
        if (feeUser) {
          feeUser.walletBalance = (feeUser.walletBalance || 0) + preview.platformFee;
          feeUser.walletVersion = (feeUser.walletVersion || 0) + 1;
          await feeUser.save({ session });

          await Transaction.create(
            [
              {
                userId: feeUser._id,
                type: TRANSACTION_TYPES.FEE,
                direction: TRANSACTION_DIRECTIONS.CREDIT,
                amount: preview.platformFee,
                balanceAfter: feeUser.walletBalance,
                walletVersion: feeUser.walletVersion,
                refType: 'Payout',
                refId: payout[0]._id.toString()
              }
            ],
            { session }
          );
        }
      }

      // 4. Mark all investments as EXITED with proportional payoutAmount
      for (const item of preview.items) {
        const investments = await Investment.find({
          propertyId: property._id,
          investorId: item.investorId,
          status: INVESTMENT_STATUS.ACTIVE
        }).session(session);

        let remainingItemPayout = item.amount;
        for (let i = 0; i < investments.length; i++) {
          const inv = investments[i];
          const invPayout = i === investments.length - 1
            ? remainingItemPayout
            : Math.floor((item.amount * inv.units) / item.units);

          remainingItemPayout -= invPayout;
          inv.status = INVESTMENT_STATUS.EXITED;
          inv.payoutAmount = invPayout;
          await inv.save({ session });
        }
      }

      // 5. Update property status to SOLD
      property.status = PROPERTY_STATUS.SOLD;
      property.salePrice = salePrice;
      property.soldAt = new Date();
      await property.save({ session });

      await session.commitTransaction();

      return {
        property,
        payout: payout[0]
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }
}

export const payoutService = new PayoutService();

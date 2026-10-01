import mongoose from 'mongoose';
import { User, Property, Transaction, Withdrawal, Settings, Investment } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES, PROPERTY_STATUS, TRANSACTION_TYPES, TRANSACTION_DIRECTIONS, KYC_STATUS, WITHDRAWAL_STATUS } from '../../shared/constants.js';
import { ERROR_CODES } from '../../shared/errorCodes.js';

export class AdminService {
  /**
   * GET /admin/stats
   * Aggregates platform AUM, user distribution, monthly funds raised, platform fees, and approval queues.
   */
  async getPlatformStats(from, to) {
    const now = new Date();
    const startOfMonth = from ? new Date(from) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const endOfMonth = to ? new Date(to) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    // 1. AUM: sum valuation of FUNDED and HOLDING properties
    const aumAggregate = await Property.aggregate([
      { $match: { status: { $in: [PROPERTY_STATUS.FUNDED, PROPERTY_STATUS.HOLDING] } } },
      { $group: { _id: null, totalAum: { $sum: '$valuation' } } }
    ]);
    const aum = aumAggregate[0]?.totalAum || 0;

    // 2. Users by role
    const usersByRoleAgg = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const usersByRole = {
      [ROLES.ADMIN]: 0,
      [ROLES.BROKER]: 0,
      [ROLES.INVESTOR]: 0
    };
    usersByRoleAgg.forEach((item) => {
      if (usersByRole[item._id] !== undefined) {
        usersByRole[item._id] = item.count;
      }
    });

    // 3. Live properties count
    const liveProperties = await Property.countDocuments({ status: PROPERTY_STATUS.LIVE });

    // 4. Funds raised this month: sum(INVESTMENT debits) - sum(REFUND credits) in current month
    const raisedAgg = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          type: { $in: [TRANSACTION_TYPES.INVESTMENT, TRANSACTION_TYPES.REFUND] }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);
    let investedThisMonth = 0;
    let refundedThisMonth = 0;
    raisedAgg.forEach((item) => {
      if (item._id === TRANSACTION_TYPES.INVESTMENT) investedThisMonth = item.total;
      if (item._id === TRANSACTION_TYPES.REFUND) refundedThisMonth = item.total;
    });
    const fundsRaisedThisMonth = Math.max(0, investedThisMonth - refundedThisMonth);

    // 5. Platform fees earned (from FEE ledger entries)
    const feesAgg = await Transaction.aggregate([
      { $match: { type: TRANSACTION_TYPES.FEE } },
      { $group: { _id: null, totalFees: { $sum: '$amount' } } }
    ]);
    const platformFeesEarned = feesAgg[0]?.totalFees || 0;

    // 6. Properties by status
    const propStatusAgg = await Property.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const propertiesByStatus = Object.values(PROPERTY_STATUS).map((status) => {
      const match = propStatusAgg.find((item) => item._id === status);
      return { status, count: match ? match.count : 0 };
    });

    // 7. Approval queues counters
    const [pendingProperties, pendingBrokers, pendingKyc, pendingWithdrawals] = await Promise.all([
      Property.countDocuments({ status: PROPERTY_STATUS.PENDING_APPROVAL }),
      User.countDocuments({ role: ROLES.BROKER, brokerApproved: false }),
      User.countDocuments({ 'kyc.status': KYC_STATUS.PENDING }),
      Withdrawal.countDocuments({ status: WITHDRAWAL_STATUS.PENDING })
    ]);

    // 8. Funds raised series (last 30 days daily aggregate)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    const seriesAgg = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          type: TRANSACTION_TYPES.INVESTMENT
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    const fundsRaisedSeries = seriesAgg.map((item) => ({
      date: item._id,
      amount: item.amount
    }));

    return {
      aum,
      usersByRole,
      liveProperties,
      fundsRaisedThisMonth,
      platformFeesEarned,
      fundsRaisedSeries,
      propertiesByStatus,
      approvalQueue: {
        properties: pendingProperties,
        brokers: pendingBrokers,
        kyc: pendingKyc,
        withdrawals: pendingWithdrawals
      }
    };
  }

  /**
   * GET /admin/users
   * Paginated user list with role, active, broker approval, and kyc status filters.
   */
  async getUsers(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.role) filter.role = query.role;
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.brokerApproved !== undefined) filter.brokerApproved = query.brokerApproved;
    if (query.kycStatus) filter['kyc.status'] = query.kycStatus;

    if (query.search) {
      const sanitized = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { email: { $regex: sanitized, $options: 'i' } }
      ];
    }

    const sortOption = {};
    if (query.sort) {
      const desc = query.sort.startsWith('-');
      const field = desc ? query.sort.substring(1) : query.sort;
      sortOption[field] = desc ? -1 : 1;
    } else {
      sortOption.createdAt = -1;
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('_id name email phone role isActive brokerApproved kyc createdAt updatedAt')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: users,
      page,
      limit,
      total,
      totalPages
    };
  }

  /**
   * PATCH /admin/users/:id
   * Admin updates user status, role, or broker approval.
   */
  async updateUser(userId, data) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw ApiError.badRequest('Invalid user ID', ERROR_CODES.VALIDATION_ERROR);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found', ERROR_CODES.NOT_FOUND);
    }

    // Invariant: Guard against deactivating or demoting the last active admin
    if (user.role === ROLES.ADMIN) {
      const isDemoting = data.role && data.role !== ROLES.ADMIN;
      const isDeactivating = data.isActive === false;
      if (isDemoting || isDeactivating) {
        const activeAdminsCount = await User.countDocuments({ role: ROLES.ADMIN, isActive: true });
        if (activeAdminsCount <= 1) {
          throw ApiError.conflict('Cannot deactivate or demote the last active admin', ERROR_CODES.CONFLICT);
        }
      }
    }

    // If approving broker, target user must be a BROKER
    if (data.brokerApproved !== undefined && data.brokerApproved === true) {
      const effectiveRole = data.role || user.role;
      if (effectiveRole !== ROLES.BROKER) {
        throw ApiError.badRequest('Only brokers can be marked as brokerApproved', ERROR_CODES.VALIDATION_ERROR);
      }
    }

    // Applying updates
    if (data.isActive !== undefined) {
      user.isActive = data.isActive;
      // Invalidate existing sessions if deactivated
      if (data.isActive === false) {
        user.sessionVersion = (user.sessionVersion || 0) + 1;
      }
    }

    if (data.role !== undefined) {
      user.role = data.role;
      user.sessionVersion = (user.sessionVersion || 0) + 1;
    }

    if (data.brokerApproved !== undefined) {
      user.brokerApproved = data.brokerApproved;
    }

    await user.save();

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      brokerApproved: user.brokerApproved,
      kyc: user.kyc,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  /**
   * GET /admin/settings
   * Fetches singleton platform parameters.
   */
  async getSettings() {
    let settings = await Settings.findOne({ singletonKey: 'platform' }).lean();
    if (!settings) {
      settings = await Settings.create({
        singletonKey: 'platform',
        platformFeePct: 2,
        brokerCommissionPct: 1,
        maxOwnershipPct: 49
      });
    }

    return {
      platformFeePct: settings.platformFeePct,
      brokerCommissionPct: settings.brokerCommissionPct,
      maxOwnershipPct: settings.maxOwnershipPct
    };
  }

  /**
   * PATCH /admin/settings
   * Updates platform singleton fee and cap parameters.
   */
  async updateSettings(data) {
    let settings = await Settings.findOne({ singletonKey: 'platform' });
    if (!settings) {
      settings = new Settings({ singletonKey: 'platform' });
    }

    if (data.platformFeePct !== undefined) {
      settings.platformFeePct = Number(data.platformFeePct.toFixed(2));
    }
    if (data.brokerCommissionPct !== undefined) {
      settings.brokerCommissionPct = Number(data.brokerCommissionPct.toFixed(2));
    }
    if (data.maxOwnershipPct !== undefined) {
      settings.maxOwnershipPct = Number(data.maxOwnershipPct.toFixed(2));
    }

    await settings.save();

    return {
      platformFeePct: settings.platformFeePct,
      brokerCommissionPct: settings.brokerCommissionPct,
      maxOwnershipPct: settings.maxOwnershipPct
    };
  }

  /**
   * GET /admin/withdrawals
   * Paginated withdrawal requests for admin queue.
   */
  async getWithdrawals(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.userId) filter.userId = query.userId;
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = new Date(query.from);
      if (query.to) filter.createdAt.$lte = new Date(query.to);
    }

    const sortOption = {};
    if (query.sort) {
      const desc = query.sort.startsWith('-');
      const field = desc ? query.sort.substring(1) : query.sort;
      sortOption[field] = desc ? -1 : 1;
    } else {
      sortOption.createdAt = -1;
    }

    const [total, withdrawals] = await Promise.all([
      Withdrawal.countDocuments(filter),
      Withdrawal.find(filter)
        .populate('userId', 'name email phone')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: withdrawals,
      page,
      limit,
      total,
      totalPages
    };
  }

  /**
   * PATCH /admin/withdrawals/:id
   * Admin approves or rejects a pending withdrawal request.
   */
  async processWithdrawal(withdrawalId, data, adminId) {
    if (!mongoose.Types.ObjectId.isValid(withdrawalId)) {
      throw ApiError.badRequest('Invalid withdrawal ID', ERROR_CODES.VALIDATION_ERROR);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const withdrawal = await Withdrawal.findById(withdrawalId).session(session);
      if (!withdrawal) {
        throw ApiError.notFound('Withdrawal not found', ERROR_CODES.NOT_FOUND);
      }

      if (withdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
        throw ApiError.conflict('Withdrawal has already been processed', ERROR_CODES.WITHDRAWAL_ALREADY_PROCESSED);
      }

      const user = await User.findById(withdrawal.userId).session(session);
      if (!user) {
        throw ApiError.notFound('Associated investor account not found', ERROR_CODES.NOT_FOUND);
      }

      if (data.status === WITHDRAWAL_STATUS.APPROVED) {
        if (user.walletBalance < withdrawal.amount) {
          throw ApiError.conflict('User wallet balance is insufficient for withdrawal', ERROR_CODES.INSUFFICIENT_BALANCE);
        }

        withdrawal.status = WITHDRAWAL_STATUS.APPROVED;
        withdrawal.processedBy = adminId;
        withdrawal.processedAt = new Date();
        await withdrawal.save({ session });

        // Update user wallet balance and sequence
        const newBalance = user.walletBalance - withdrawal.amount;
        user.walletBalance = newBalance;
        user.walletVersion = (user.walletVersion || 0) + 1;
        await user.save({ session });

        // Post ledger DEBIT
        await Transaction.create(
          [
            {
              userId: user._id,
              type: TRANSACTION_TYPES.WITHDRAWAL,
              direction: TRANSACTION_DIRECTIONS.DEBIT,
              amount: withdrawal.amount,
              balanceAfter: newBalance,
              walletVersion: user.walletVersion,
              refType: 'Withdrawal',
              refId: withdrawal._id.toString()
            }
          ],
          { session }
        );
      } else if (data.status === WITHDRAWAL_STATUS.REJECTED) {
        withdrawal.status = WITHDRAWAL_STATUS.REJECTED;
        withdrawal.reason = data.reason;
        withdrawal.processedBy = adminId;
        withdrawal.processedAt = new Date();
        await withdrawal.save({ session });
        // Released reservation back to available balance
      }

      await session.commitTransaction();

      // Compute wallet reservation
      const pendingWithdrawalsSum = await Withdrawal.aggregate([
        { $match: { userId: user._id, status: WITHDRAWAL_STATUS.PENDING } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const reserved = pendingWithdrawalsSum[0]?.total || 0;

      return {
        withdrawal,
        wallet: {
          balance: user.walletBalance,
          reservedBalance: reserved,
          availableBalance: Math.max(0, user.walletBalance - reserved)
        }
      };
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  /**
   * GET /admin/properties
   * Comprehensive property management query for Admin (including drafts and rejected).
   */
  async getAdminProperties(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.brokerId) filter.brokerId = query.brokerId;
    if (query.city) filter.city = { $regex: query.city.trim(), $options: 'i' };

    if (query.search) {
      const sanitized = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { address: { $regex: sanitized, $options: 'i' } },
        { city: { $regex: sanitized, $options: 'i' } }
      ];
    }

    const sortOption = {};
    if (query.sort) {
      const desc = query.sort.startsWith('-');
      const field = desc ? query.sort.substring(1) : query.sort;
      sortOption[field] = desc ? -1 : 1;
    } else {
      sortOption.createdAt = -1;
    }

    const [total, properties] = await Promise.all([
      Property.countDocuments(filter),
      Property.find(filter)
        .populate('brokerId', 'name email phone')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const items = properties.map((prop) => {
      const totalUnits = prop.totalUnits || 0;
      const unitsSold = prop.unitsSold || 0;
      const fundingPct = totalUnits > 0 ? Number(((unitsSold / totalUnits) * 100).toFixed(2)) : 0;
      const remainingUnits = Math.max(0, totalUnits - unitsSold);

      return {
        ...prop,
        fundingPct,
        remainingUnits
      };
    });

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * GET /properties/:id/investors
   * Aggregates active investors and fractional holdings for a given property.
   */
  async getPropertyInvestors(propertyId, query, currentUser) {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      throw ApiError.badRequest('Invalid property ID', ERROR_CODES.VALIDATION_ERROR);
    }

    const property = await Property.findById(propertyId).lean();
    if (!property) {
      throw ApiError.notFound('Property not found', ERROR_CODES.NOT_FOUND);
    }

    // If broker is querying, ensure they own the property
    if (currentUser.role === ROLES.BROKER && String(property.brokerId) !== String(currentUser._id)) {
      throw ApiError.notFound('Property not found', ERROR_CODES.NOT_FOUND);
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const aggregatePipeline = [
      { $match: { propertyId: new mongoose.Types.ObjectId(propertyId) } },
      {
        $group: {
          _id: '$investorId',
          units: { $sum: '$units' },
          amount: { $sum: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'investor'
        }
      },
      { $unwind: '$investor' },
      { $sort: { units: -1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limit }]
        }
      }
    ];

    const result = await Investment.aggregate(aggregatePipeline);
    const total = result[0]?.metadata[0]?.total || 0;
    const rawItems = result[0]?.data || [];

    const items = rawItems.map((item) => {
      const ownershipPct = property.totalUnits > 0 ? Number(((item.units / property.totalUnits) * 100).toFixed(2)) : 0;
      let displayName = item.investor.name;
      // Mask name for brokers as specified in API_DESIGN.md
      if (currentUser.role === ROLES.BROKER) {
        displayName = item.investor.name ? `${item.investor.name.charAt(0)}***` : 'Investor';
      }

      return {
        investorId: item._id,
        displayName,
        units: item.units,
        amount: item.amount,
        ownershipPct
      };
    });

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }
}

export const adminService = new AdminService();

import { propertyLifecycleService } from '../services/propertyLifecycle.service.js';
import { payoutService } from '../services/payout.service.js';
import { adminService } from '../services/admin.service.js';

export class PropertyAdminController {
  async approveProperty(req, res, next) {
    try {
      const property = await propertyLifecycleService.approve(req.params.id, req.user._id);
      return res.status(200).json({
        success: true,
        data: property,
        message: 'Property approved and now LIVE'
      });
    } catch (err) {
      next(err);
    }
  }

  async rejectProperty(req, res, next) {
    try {
      const property = await propertyLifecycleService.reject(req.params.id, req.body.reason, req.user._id);
      return res.status(200).json({
        success: true,
        data: property,
        message: 'Property rejected'
      });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const result = await propertyLifecycleService.updateStatus(req.params.id, req.body.status, req.user._id);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Property status updated'
      });
    } catch (err) {
      next(err);
    }
  }

  async getPayoutPreview(req, res, next) {
    try {
      const preview = await payoutService.previewPayout(req.params.id, Number(req.query.salePrice));
      return res.status(200).json({
        success: true,
        data: preview,
        message: 'Payout preview calculated'
      });
    } catch (err) {
      next(err);
    }
  }

  async sellProperty(req, res, next) {
    try {
      const { salePrice, expectedPlatformFeePct } = req.body;
      const result = await payoutService.executePayout(req.params.id, salePrice, expectedPlatformFeePct, req.user._id);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Sale recorded and payouts credited'
      });
    } catch (err) {
      next(err);
    }
  }

  async getPropertyInvestors(req, res, next) {
    try {
      const result = await adminService.getPropertyInvestors(req.params.id, req.query, req.user);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Property investors retrieved'
      });
    } catch (err) {
      next(err);
    }
  }
}

export const propertyAdminController = new PropertyAdminController();

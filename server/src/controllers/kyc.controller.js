import { kycService } from '../services/kyc.service.js';

export class KycController {
  async submitKyc(req, res, next) {
    try {
      const result = await kycService.submitKyc(req.user._id, req.body);
      return res.status(201).json({
        success: true,
        data: result,
        message: 'KYC submitted successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async reviewKyc(req, res, next) {
    try {
      const result = await kycService.reviewKyc(req.params.userId, req.body, req.user._id);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'KYC review completed'
      });
    } catch (err) {
      next(err);
    }
  }
}

export const kycController = new KycController();

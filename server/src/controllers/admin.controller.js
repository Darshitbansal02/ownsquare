import { adminService } from '../services/admin.service.js';

export class AdminController {
  async getStats(req, res, next) {
    try {
      const { from, to } = req.query;
      const stats = await adminService.getPlatformStats(from, to);
      return res.status(200).json({
        success: true,
        data: stats,
        message: 'Platform stats retrieved'
      });
    } catch (err) {
      next(err);
    }
  }

  async getUsers(req, res, next) {
    try {
      const result = await adminService.getUsers(req.query);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Users retrieved'
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await adminService.updateUser(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data: user,
        message: 'User updated'
      });
    } catch (err) {
      next(err);
    }
  }

  async getSettings(req, res, next) {
    try {
      const settings = await adminService.getSettings();
      return res.status(200).json({
        success: true,
        data: settings,
        message: 'Settings retrieved'
      });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const settings = await adminService.updateSettings(req.body);
      return res.status(200).json({
        success: true,
        data: settings,
        message: 'Settings updated'
      });
    } catch (err) {
      next(err);
    }
  }

  async getWithdrawals(req, res, next) {
    try {
      const result = await adminService.getWithdrawals(req.query);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Withdrawals retrieved'
      });
    } catch (err) {
      next(err);
    }
  }

  async processWithdrawal(req, res, next) {
    try {
      const result = await adminService.processWithdrawal(req.params.id, req.body, req.user._id);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Withdrawal processed'
      });
    } catch (err) {
      next(err);
    }
  }

  async getProperties(req, res, next) {
    try {
      const result = await adminService.getAdminProperties(req.query);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Properties retrieved'
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();

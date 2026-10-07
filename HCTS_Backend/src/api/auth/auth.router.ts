import express from 'express';
import { encryptResponseMiddleware } from '../../middlewares/encryptResponse.ts';
import { authMiddleware, requirePermission, requireSystemAdminRole } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import authController from './auth.controller.ts';
import './auth.swagger.ts';
import {
  addUserValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  getAllUsersValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
  sendPasswordOtpValidator,
  updateCurrentUserValidator,
  updateUserValidator,
  userIdParamValidator,
  verifyOtpValidator,
} from './auth.validator.ts';

const UserRouter = express.Router();

UserRouter.post(
  '/register',
  authMiddleware,
  requirePermission('user_management_access_control'),
  auditLogMiddleware({ event: 'USER_REGISTERED', entityType: 'user' }),
  registerValidator,
  validateRequest,
  catchAsync(authController.register),
  // encryptResponseMiddleware
);

UserRouter.post(
  '/login',
  auditLogMiddleware({ event: 'USER_LOGIN', entityType: 'user' }),
  loginValidator,
  validateRequest,
  catchAsync(authController.login),
  // encryptResponseMiddleware
);

UserRouter.post(
  '/add-user',
  authMiddleware,
  requirePermission('user_management_access_control'),
  auditLogMiddleware({ event: 'USER_CREATED', entityType: 'user' }),
  addUserValidator,
  validateRequest,
  catchAsync(authController.addUser),
  // encryptResponseMiddleware
);

UserRouter.get(
  '/all-users',
  getAllUsersValidator,
  validateRequest,
  catchAsync(authController.getAllUsers),
  // encryptResponseMiddleware
);

UserRouter.get(
  '/me',
  authMiddleware,
  catchAsync(authController.getCurrentUser),
  // encryptResponseMiddleware
);

UserRouter.put(
  '/me',
  authMiddleware,
  auditLogMiddleware({ event: 'CURRENT_USER_UPDATED', entityType: 'user' }),
  updateCurrentUserValidator,
  validateRequest,
  catchAsync(authController.updateCurrentUser),
  // encryptResponseMiddleware
);

UserRouter.get(
  '/:userId',
  authMiddleware,
  requirePermission('user_management_access_control'),
  userIdParamValidator,
  validateRequest,
  catchAsync(authController.getUserById),
  // encryptResponseMiddleware
);

UserRouter.put(
  '/:userId',
  authMiddleware,
  requirePermission('user_management_access_control'),
  auditLogMiddleware({
    event: 'USER_UPDATED',
    entityType: 'user',
    getTargetUserId: (req) => String(req.params.userId),
  }),
  updateUserValidator,
  validateRequest,
  catchAsync(authController.updateUser),
  // encryptResponseMiddleware
);

UserRouter.patch(
  '/:userId',
  authMiddleware,
  requirePermission('user_management_access_control'),
  auditLogMiddleware({
    event: 'USER_UPDATED',
    entityType: 'user',
    getTargetUserId: (req) => String(req.params.userId),
  }),
  updateUserValidator,
  validateRequest,
  catchAsync(authController.updateUser),
  // encryptResponseMiddleware
);

UserRouter.patch(
  '/:userId/activate',
  authMiddleware,
  requirePermission('user_management_access_control'),
  requireSystemAdminRole(),
  auditLogMiddleware({
    event: 'USER_ACTIVATED',
    entityType: 'user',
    getTargetUserId: (req) => String(req.params.userId),
  }),
  userIdParamValidator,
  validateRequest,
  catchAsync(authController.activateUser),
  // encryptResponseMiddleware
);

UserRouter.patch(
  '/:userId/deactivate',
  authMiddleware,
  requirePermission('user_management_access_control'),
  requireSystemAdminRole(),
  auditLogMiddleware({
    event: 'USER_DEACTIVATED',
    entityType: 'user',
    getTargetUserId: (req) => String(req.params.userId),
  }),
  userIdParamValidator,
  validateRequest,
  catchAsync(authController.deactivateUser),
  // encryptResponseMiddleware
);

UserRouter.post(
  '/:userId/force-logout',
  authMiddleware,
  requirePermission('user_management_access_control'),
  auditLogMiddleware({
    event: 'USER_FORCE_LOGOUT',
    entityType: 'user',
    getTargetUserId: (req) => String(req.params.userId),
  }),
  userIdParamValidator,
  validateRequest,
  catchAsync(authController.forceLogoutUser),
  // encryptResponseMiddleware
);

UserRouter.post(
  '/forgot-password',
  auditLogMiddleware({ event: 'USER_FORGOT_PASSWORD', entityType: 'user' }),
  forgotPasswordValidator,
  validateRequest,
  catchAsync(authController.forgotPassword),
  // encryptResponseMiddleware
);

UserRouter.post(
  '/send-password-otp',
  auditLogMiddleware({ event: 'PASSWORD_OTP_SENT', entityType: 'user' }),
  sendPasswordOtpValidator,
  validateRequest,
  catchAsync(authController.sendPasswordOtp),
  // encryptResponseMiddleware
);

UserRouter.post(
  '/verify-otp',
  auditLogMiddleware({ event: 'PASSWORD_OTP_VERIFIED', entityType: 'user' }),
  verifyOtpValidator,
  validateRequest,
  catchAsync(authController.verifyOtp),
  // encryptResponseMiddleware
);

UserRouter.post(
  '/change-password',
  authMiddleware,
  auditLogMiddleware({ event: 'USER_PASSWORD_CHANGED', entityType: 'user' }),
  changePasswordValidator,
  validateRequest,
  catchAsync(authController.changePassword),
  // encryptResponseMiddleware
);

UserRouter.post(
  '/reset-password',
  auditLogMiddleware({ event: 'USER_PASSWORD_RESET', entityType: 'user' }),
  resetPasswordValidator,
  validateRequest,
  catchAsync(authController.resetPassword),
  // encryptResponseMiddleware
);

UserRouter.post(
  '/refresh-token',
  auditLogMiddleware({ event: 'TOKEN_REFRESHED', entityType: 'user' }),
  catchAsync(authController.refreshToken),
  // encryptResponseMiddleware
);

UserRouter.post(
  '/logout',
  authMiddleware,
  auditLogMiddleware({ event: 'USER_LOGOUT', entityType: 'user' }),
  catchAsync(authController.logout),
  // encryptResponseMiddleware
);

export default UserRouter;

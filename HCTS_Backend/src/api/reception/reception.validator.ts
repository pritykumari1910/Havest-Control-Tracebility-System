import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';

export const createReceptionBatchValidator = [
  body('machineId')
    .notEmpty()
    .withMessage('machineId is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('machineId must be a valid ObjectId');
      }
      return true;
    }),

  body('operatorId')
    .notEmpty()
    .withMessage('operatorId is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('operatorId must be a valid ObjectId');
      }
      return true;
    }),

  body('workDate')
    .optional()
    .isISO8601()
    .withMessage('workDate must be a valid ISO8601 date'),
];

export const updateReceptionBatchValidator = [
  param('batchId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('batchId must be a valid ObjectId');
      }
      return true;
    }),

  body('machineId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('machineId must be a valid ObjectId');
      }
      return true;
    }),

  body('operatorId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('operatorId must be a valid ObjectId');
      }
      return true;
    }),

  body('workDate')
    .optional()
    .isISO8601()
    .withMessage('workDate must be a valid ISO8601 date'),

  body('status')
    .optional()
    .isIn(['open', 'closed'])
    .withMessage("status must be 'open' or 'closed'"),
];

export const scanHarvestBinValidator = [
  param('batchId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('batchId must be a valid ObjectId');
      }
      return true;
    }),

  body('qrCode')
    .notEmpty()
    .withMessage('qrCode is required')
    .isString()
    .withMessage('qrCode must be a string')
    .trim(),
];

export const closeReceptionBatchValidator = [
  param('batchId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('batchId must be a valid ObjectId');
      }
      return true;
    }),
];

export const getReceptionBatchesValidator = [
  query('status')
    .optional()
    .isIn(['open', 'closed'])
    .withMessage("status must be 'open' or 'closed'"),
];

export const getReceivedBinInventoryValidator = [
  query('batchId').optional().isMongoId().withMessage('batchId must be a valid ObjectId'),
  query('crewId').optional().isMongoId().withMessage('crewId must be a valid ObjectId'),
  query('machineId').optional().isMongoId().withMessage('machineId must be a valid ObjectId'),
  query('varietyId').optional().isMongoId().withMessage('varietyId must be a valid ObjectId'),
  query('date').optional().isISO8601().withMessage('date must be a valid ISO8601 date string'),
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('limit must be between 1 and 100'),
];

export const createIncidentValidator = [
  body('qrCode').notEmpty().isString().trim().withMessage('qrCode is required'),
  body('receptionBatchId').optional().isMongoId().withMessage('receptionBatchId must be a valid ObjectId'),
  body('category')
    .notEmpty()
    .isIn([
      'missing_qr_label',
      'damaged_unreadable_label',
      'single_label_present',
      'damaged_pallet_bin',
      'damaged_dirty_fruit',
      'mixed_varieties',
      'pallet_outside_assigned_zone',
      'handling_issue',
      'other',
    ])
    .withMessage('category is invalid'),
  body('comments').optional().isString().trim(),
  body('location').optional().isObject().withMessage('location must be an object'),
  body('location.latitude').optional().isNumeric().withMessage('location.latitude must be a number'),
  body('location.longitude').optional().isNumeric().withMessage('location.longitude must be a number'),
];

export const getIncidentsValidator = [
  query('qrCode').optional().isString().trim(),
  query('receptionBatchId').optional().isMongoId().withMessage('receptionBatchId must be a valid ObjectId'),
  query('category').optional().isString().trim(),
  query('date').optional().isISO8601().withMessage('date must be a valid ISO8601 date string'),
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('limit must be between 1 and 100'),
];


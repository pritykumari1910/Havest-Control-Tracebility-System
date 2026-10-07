import { body, query } from 'express-validator';
import { Types } from 'mongoose';

export const registerSatelliteStaffValidator = [
  body('workDate')
    .notEmpty()
    .withMessage('workDate is required')
    .isISO8601()
    .withMessage('workDate must be a valid ISO8601 date'),

  body('workerId')
    .notEmpty()
    .withMessage('workerId is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('workerId must be a valid ObjectId');
      }
      return true;
    }),

  body('satelliteRoleId')
    .notEmpty()
    .withMessage('satelliteRoleId is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('satelliteRoleId must be a valid ObjectId');
      }
      return true;
    }),

  body('farmId')
    .notEmpty()
    .withMessage('farmId is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('farmId must be a valid ObjectId');
      }
      return true;
    }),

  body('plotId')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('plotId must be a valid ObjectId');
      }
      return true;
    }),

  body('valveId')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('valveId must be a valid ObjectId');
      }
      return true;
    }),

  body('shiftType')
    .optional()
    .isIn(['full', 'partial'])
    .withMessage("shiftType must be 'full' or 'partial'"),

  body('shiftFraction')
    .optional()
    .isFloat({ min: 0.0, max: 1.0 })
    .withMessage('shiftFraction must be a float between 0.0 and 1.0'),

  body('partialReason')
    .optional()
    .isString()
    .withMessage('partialReason must be a string')
    .trim(),

  body('checkInTime')
    .optional()
    .isISO8601()
    .withMessage('checkInTime must be a valid ISO8601 date string'),

  body('checkOutTime')
    .optional()
    .isISO8601()
    .withMessage('checkOutTime must be a valid ISO8601 date string'),
];

export const getDailySatelliteStaffValidator = [
  query('workDate')
    .optional()
    .isISO8601()
    .withMessage('workDate must be a valid ISO8601 date'),

  query('satelliteRoleId')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('satelliteRoleId must be a valid ObjectId');
      }
      return true;
    }),

  query('farmId')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('farmId must be a valid ObjectId');
      }
      return true;
    }),

  query('campaignId')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('campaignId must be a valid ObjectId');
      }
      return true;
    }),
];

export const bulkSyncSatelliteStaffValidator = [
  body('records')
    .notEmpty()
    .withMessage('records array is required')
    .isArray()
    .withMessage('records must be an array'),

  body('records.*.workDate')
    .notEmpty()
    .withMessage('workDate is required')
    .isISO8601()
    .withMessage('workDate must be a valid ISO8601 date'),

  body('records.*.workerId')
    .notEmpty()
    .withMessage('workerId is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('workerId must be a valid ObjectId');
      }
      return true;
    }),

  body('records.*.satelliteRoleId')
    .notEmpty()
    .withMessage('satelliteRoleId is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('satelliteRoleId must be a valid ObjectId');
      }
      return true;
    }),

  body('records.*.farmId')
    .notEmpty()
    .withMessage('farmId is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('farmId must be a valid ObjectId');
      }
      return true;
    }),

  body('records.*.plotId')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('plotId must be a valid ObjectId');
      }
      return true;
    }),

  body('records.*.valveId')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('valveId must be a valid ObjectId');
      }
      return true;
    }),

  body('records.*.shiftType')
    .optional()
    .isIn(['full', 'partial'])
    .withMessage("shiftType must be 'full' or 'partial'"),

  body('records.*.shiftFraction')
    .optional()
    .isFloat({ min: 0.0, max: 1.0 })
    .withMessage('shiftFraction must be a float between 0.0 and 1.0'),

  body('records.*.partialReason')
    .optional()
    .isString()
    .withMessage('partialReason must be a string')
    .trim(),

  body('records.*.checkInTime')
    .optional()
    .isISO8601()
    .withMessage('checkInTime must be a valid ISO8601 date string'),

  body('records.*.checkOutTime')
    .optional()
    .isISO8601()
    .withMessage('checkOutTime must be a valid ISO8601 date string'),
];

export const updateSatelliteStaffValidator = [
  body('workDate')
    .optional()
    .isISO8601()
    .withMessage('workDate must be a valid ISO8601 date'),

  body('workerId')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('workerId must be a valid ObjectId');
      }
      return true;
    }),

  body('satelliteRoleId')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('satelliteRoleId must be a valid ObjectId');
      }
      return true;
    }),

  body('farmId')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('farmId must be a valid ObjectId');
      }
      return true;
    }),

  body('plotId')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('plotId must be a valid ObjectId');
      }
      return true;
    }),

  body('valveId')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('valveId must be a valid ObjectId');
      }
      return true;
    }),

  body('shiftType')
    .optional()
    .isIn(['full', 'partial'])
    .withMessage("shiftType must be 'full' or 'partial'"),

  body('shiftFraction')
    .optional()
    .isFloat({ min: 0.0, max: 1.0 })
    .withMessage('shiftFraction must be a float between 0.0 and 1.0'),

  body('partialReason')
    .optional()
    .isString()
    .withMessage('partialReason must be a string')
    .trim(),

  body('checkInTime')
    .optional()
    .isISO8601()
    .withMessage('checkInTime must be a valid ISO8601 date string'),

  body('checkOutTime')
    .optional()
    .isISO8601()
    .withMessage('checkOutTime must be a valid ISO8601 date string'),
];

export const checkInStaffValidator = [
  body('entryTime')
    .optional()
    .isISO8601()
    .withMessage('entryTime must be a valid ISO8601 date string'),
];

export const checkOutStaffValidator = [
  body('exitTime')
    .optional()
    .isISO8601()
    .withMessage('exitTime must be a valid ISO8601 date string'),
];

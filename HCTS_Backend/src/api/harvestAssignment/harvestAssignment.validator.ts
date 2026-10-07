import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';
import { HarvestAssignmentStatus } from '../../models/harvestAssignment.model.ts';

export const createAssignmentValidator = [
  body('crewId')
    .notEmpty()
    .withMessage('crewId is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('crewId must be a valid ObjectId');
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
    .notEmpty()
    .withMessage('plotId is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('plotId must be a valid ObjectId');
      }
      return true;
    }),

  body('valveId')
    .optional({ nullable: true })
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('valveId must be a valid ObjectId');
      }
      return true;
    }),

  body('parkId')
    .optional({ nullable: true })
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('parkId must be a valid ObjectId');
      }
      return true;
    }),

  body('varietyId')
    .notEmpty()
    .withMessage('varietyId is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('varietyId must be a valid ObjectId');
      }
      return true;
    }),

  body('qrSeriesId')
    .notEmpty()
    .withMessage('qrSeriesId is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('qrSeriesId must be a valid ObjectId');
      }
      return true;
    }),

  body('startQrNumber')
    .notEmpty()
    .withMessage('startQrNumber is required')
    .isInt({ min: 1 })
    .withMessage('startQrNumber must be a positive integer'),

  body('endQrNumber')
    .notEmpty()
    .withMessage('endQrNumber is required')
    .isInt({ min: 1 })
    .withMessage('endQrNumber must be a positive integer'),

  body('zoneType')
    .optional()
    .isIn(['normal', 'trial', 'monitoring', 'control', 'other'])
    .withMessage("zoneType must be one of: 'normal', 'trial', 'monitoring', 'control', 'other'"),

  body('workDate')
    .optional()
    .isISO8601()
    .withMessage('workDate must be a valid ISO8601 date string'),
];

export const getAssignmentsValidator = [
  query('crewId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('crewId must be a valid ObjectId');
      }
      return true;
    }),

  query('farmId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('farmId must be a valid ObjectId');
      }
      return true;
    }),

  query('plotId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('plotId must be a valid ObjectId');
      }
      return true;
    }),

  query('status')
    .optional()
    .isIn(Object.values(HarvestAssignmentStatus))
    .withMessage(`status must be one of: ${Object.values(HarvestAssignmentStatus).join(', ')}`),

  query('workDate')
    .optional()
    .isISO8601()
    .withMessage('workDate must be a valid ISO8601 date string'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer greater than or equal to 1')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100')
    .toInt(),
];

export const assignmentIdParamValidator = [
  param('assignmentId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('assignmentId must be a valid ObjectId');
      }
      return true;
    }),
];

export const updateAssignmentStatusValidator = [
  param('assignmentId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('assignmentId must be a valid ObjectId');
      }
      return true;
    }),

  body('status')
    .notEmpty()
    .withMessage('status is required')
    .isIn(Object.values(HarvestAssignmentStatus))
    .withMessage(`status must be one of: ${Object.values(HarvestAssignmentStatus).join(', ')}`),
];

export const assignQrRangeValidator = [
  param('assignmentId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('assignmentId must be a valid ObjectId');
      }
      return true;
    }),

  body('qrSeriesId')
    .notEmpty()
    .withMessage('qrSeriesId is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('qrSeriesId must be a valid ObjectId');
      }
      return true;
    }),

  body('startQrNumber')
    .notEmpty()
    .withMessage('startQrNumber is required')
    .isInt({ min: 1 })
    .withMessage('startQrNumber must be a positive integer'),

  body('endQrNumber')
    .notEmpty()
    .withMessage('endQrNumber is required')
    .isInt({ min: 1 })
    .withMessage('endQrNumber must be a positive integer'),
];

export const changeVarietyMidDayValidator = [
  param('assignmentId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('assignmentId must be a valid ObjectId');
      }
      return true;
    }),

  body('newVarietyId')
    .notEmpty()
    .withMessage('newVarietyId is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('newVarietyId must be a valid ObjectId');
      }
      return true;
    }),

  body('confirm')
    .notEmpty()
    .withMessage('confirm is required')
    .isBoolean()
    .withMessage('confirm must be a boolean value'),
];

export const updateAssignmentValidator = [
  param('assignmentId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('assignmentId must be a valid ObjectId');
      }
      return true;
    }),

  body('crewId')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('crewId must be a valid ObjectId');
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
    .optional({ nullable: true })
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('valveId must be a valid ObjectId');
      }
      return true;
    }),

  body('parkId')
    .optional({ nullable: true })
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('parkId must be a valid ObjectId');
      }
      return true;
    }),

  body('varietyId')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('varietyId must be a valid ObjectId');
      }
      return true;
    }),

  body('zoneType')
    .optional()
    .isIn(['normal', 'trial', 'monitoring', 'control', 'other'])
    .withMessage('zoneType must be one of: normal, trial, monitoring, control, other'),

  body('assignedRows').optional({ nullable: true }).isString().trim(),
  body('specialZone').optional({ nullable: true }).isString().trim(),
  body('workDate').optional().isISO8601().withMessage('workDate must be a valid ISO8601 date string'),
  body('comments').optional({ nullable: true }).isString().trim(),
  body('changeReason').optional().isString().trim(),
];

export const crewIdParamValidator = [
  param('crewId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('crewId must be a valid ObjectId');
      }
      return true;
    }),

  query('status')
    .optional()
    .isIn(Object.values(HarvestAssignmentStatus))
    .withMessage(`status must be one of: ${Object.values(HarvestAssignmentStatus).join(', ')}`),

  query('workDate')
    .optional()
    .isISO8601()
    .withMessage('workDate must be a valid ISO8601 date string'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer greater than or equal to 1')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100')
    .toInt(),
];




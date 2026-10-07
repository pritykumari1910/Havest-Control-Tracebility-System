import { body, param } from 'express-validator';
import { Types } from 'mongoose';

export const workerRoleChangeValidator = [
  param('workerId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('workerId must be a valid ObjectId');
      }
      return true;
    }),

  body('workDate')
    .notEmpty()
    .withMessage('workDate is required')
    .isISO8601()
    .withMessage('workDate must be a valid ISO8601 date'),

  body('exitContext')
    .notEmpty()
    .withMessage('exitContext is required')
    .isIn(['crew', 'satellite'])
    .withMessage("exitContext must be 'crew' or 'satellite'"),

  body('exitEntityId')
    .notEmpty()
    .withMessage('exitEntityId is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('exitEntityId must be a valid ObjectId');
      }
      return true;
    }),

  body('entryContext')
    .notEmpty()
    .withMessage('entryContext is required')
    .isIn(['crew', 'satellite'])
    .withMessage("entryContext must be 'crew' or 'satellite'"),

  body('entryEntityId')
    .notEmpty()
    .withMessage('entryEntityId is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('entryEntityId must be a valid ObjectId');
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

  body('reason')
    .notEmpty()
    .withMessage('reason is required')
    .isString()
    .withMessage('reason must be a string')
    .trim(),

  body('changeTime')
    .optional()
    .isISO8601()
    .withMessage('changeTime must be a valid ISO8601 date'),
];

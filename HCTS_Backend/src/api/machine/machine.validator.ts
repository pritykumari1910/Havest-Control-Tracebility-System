import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';
import { MachineStatus } from '../../models/machine.model.ts';

export const createMachineValidator = [
  body('name')
    .notEmpty()
    .withMessage('name is required')
    .isString()
    .withMessage('name must be a string')
    .trim(),

  body('machineType')
    .notEmpty()
    .withMessage('machineType is required')
    .isString()
    .withMessage('machineType must be a string')
    .trim(),

  body('licensePlateOrInternalId')
    .optional()
    .isString()
    .withMessage('licensePlateOrInternalId must be a string')
    .trim(),

  body('comments')
    .optional()
    .isString()
    .withMessage('comments must be a string')
    .trim(),

  body('status')
    .optional()
    .isIn(Object.values(MachineStatus))
    .withMessage(`status must be one of: ${Object.values(MachineStatus).join(', ')}`),
];

export const updateMachineValidator = [
  param('machineId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('machineId must be a valid ObjectId');
      }
      return true;
    }),

  body('name')
    .optional()
    .notEmpty()
    .withMessage('name cannot be empty')
    .isString()
    .withMessage('name must be a string')
    .trim(),

  body('machineType')
    .optional()
    .notEmpty()
    .withMessage('machineType cannot be empty')
    .isString()
    .withMessage('machineType must be a string')
    .trim(),

  body('licensePlateOrInternalId')
    .optional()
    .isString()
    .withMessage('licensePlateOrInternalId must be a string')
    .trim(),

  body('comments')
    .optional()
    .isString()
    .withMessage('comments must be a string')
    .trim(),

  body('status')
    .optional()
    .isIn(Object.values(MachineStatus))
    .withMessage(`status must be one of: ${Object.values(MachineStatus).join(', ')}`),
];

export const getMachinesValidator = [
  query('status')
    .optional()
    .isIn(Object.values(MachineStatus))
    .withMessage(`status must be one of: ${Object.values(MachineStatus).join(', ')}`),

  query('machineType')
    .optional()
    .isString()
    .withMessage('machineType must be a string')
    .trim(),

  query('search')
    .optional()
    .isString()
    .withMessage('search must be a string')
    .trim(),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer greater than 0')
    .customSanitizer((value) => parseInt(value, 10)),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100')
    .customSanitizer((value) => parseInt(value, 10)),
];

export const machineIdParamValidator = [
  param('machineId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('machineId must be a valid ObjectId');
      }
      return true;
    }),
];

export const assignOperatorValidator = [
  param('machineId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('machineId must be a valid ObjectId');
      }
      return true;
    }),

  body('workerIds')
    .notEmpty()
    .withMessage('workerIds is required')
    .isArray()
    .withMessage('workerIds must be an array of worker IDs')
    .custom((value) => {
      if (!value.every((id: any) => Types.ObjectId.isValid(id))) {
        throw new Error('Each workerId must be a valid ObjectId');
      }
      return true;
    }),
];

export const removeOperatorValidator = [
  param('machineId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('machineId must be a valid ObjectId');
      }
      return true;
    }),

  param('workerId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('workerId must be a valid ObjectId');
      }
      return true;
    }),
];

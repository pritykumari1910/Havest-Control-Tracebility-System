import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';
import { FarmStatus } from '../../models/farm.model.ts';

export const createFarmValidator = [
  body('farmName')
    .notEmpty()
    .withMessage('farmName is required')
    .isString()
    .withMessage('farmName must be a string')
    .trim(),

  body('totalHectares')
    .notEmpty()
    .withMessage('totalHectares is required')
    .isFloat({ min: 0 })
    .withMessage('totalHectares must be a number greater than or equal to 0'),

  body('status')
    .optional()
    .isIn(Object.values(FarmStatus))
    .withMessage(`status must be one of: ${Object.values(FarmStatus).join(', ')}`),

  body('comments')
    .optional({ nullable: true })
    .isString()
    .withMessage('comments must be a string')
    .trim(),
];

export const updateFarmValidator = [
  param('farmId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('farmId must be a valid ObjectId');
      }
      return true;
    }),

  body('farmName')
    .optional()
    .notEmpty()
    .withMessage('farmName cannot be empty')
    .isString()
    .withMessage('farmName must be a string')
    .trim(),

  body('totalHectares')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('totalHectares must be a number greater than or equal to 0'),

  body('status')
    .optional()
    .isIn(Object.values(FarmStatus))
    .withMessage(`status must be one of: ${Object.values(FarmStatus).join(', ')}`),

  body('comments')
    .optional({ nullable: true })
    .isString()
    .withMessage('comments must be a string')
    .trim(),
];

export const farmIdParamValidator = [
  param('farmId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('farmId must be a valid ObjectId');
      }
      return true;
    }),
];

export const getFarmsValidator = [
  query('status')
    .optional()
    .isIn(Object.values(FarmStatus))
    .withMessage(`status must be one of: ${Object.values(FarmStatus).join(', ')}`),

  query('search')
    .optional()
    .isString()
    .withMessage('search must be a string'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('limit must be an integer >= 1'),
];

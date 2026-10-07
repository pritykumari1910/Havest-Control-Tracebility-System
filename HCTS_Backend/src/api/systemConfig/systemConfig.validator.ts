import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';

export const createParameterValidator = [
  body('key')
    .notEmpty()
    .withMessage('key is required')
    .isString()
    .withMessage('key must be a string')
    .trim(),

  body('value')
    .exists()
    .withMessage('value is required'),

  body('description')
    .optional()
    .isString()
    .withMessage('description must be a string')
    .trim(),
];

export const updateParameterValidator = [
  param('id')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('id must be a valid ObjectId');
      }
      return true;
    }),

  body('value')
    .optional()
    .exists(),

  body('description')
    .optional()
    .isString()
    .withMessage('description must be a string')
    .trim(),
];

export const getParametersValidator = [
  query('search')
    .optional()
    .isString()
    .withMessage('search must be a string'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('limit must be a positive integer'),
];

export const getParameterByIdValidator = [
  param('id')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('id must be a valid ObjectId');
      }
      return true;
    }),
];

export const getParameterByKeyValidator = [
  param('key')
    .notEmpty()
    .withMessage('key is required')
    .isString()
    .withMessage('key must be a string')
    .trim(),
];

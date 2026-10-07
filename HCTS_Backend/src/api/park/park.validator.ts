import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';
import { ParkStatus } from '../../models/park.model.ts';

export const createParkValidator = [
  body('parentValve')
    .notEmpty()
    .withMessage('parentValve is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('parentValve must be a valid ObjectId');
      }
      return true;
    }),

  body('parkName')
    .notEmpty()
    .withMessage('parkName is required')
    .isString()
    .withMessage('parkName must be a string')
    .trim(),

  body('rowRange')
    .notEmpty()
    .withMessage('rowRange is required')
    .isString()
    .withMessage('rowRange must be a string')
    .trim(),

  body('area')
    .notEmpty()
    .withMessage('area is required')
    .isFloat({ min: 0 })
    .withMessage('area must be a number greater than or equal to 0'),

  body('avocadoVariety')
    .notEmpty()
    .withMessage('avocadoVariety is required')
    .isArray({ min: 1 })
    .withMessage('avocadoVariety must be a non-empty array of strings'),
  body('avocadoVariety.*')
    .isString()
    .withMessage('each variety must be a string')
    .trim(),

  body('status')
    .optional()
    .isIn(Object.values(ParkStatus))
    .withMessage(`status must be one of: ${Object.values(ParkStatus).join(', ')}`),

  body('comments')
    .optional({ nullable: true })
    .isString()
    .withMessage('comments must be a string')
    .trim(),
];

export const updateParkValidator = [
  param('parkId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('parkId must be a valid ObjectId');
      }
      return true;
    }),

  body('parentValve')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('parentValve must be a valid ObjectId');
      }
      return true;
    }),

  body('parkName')
    .optional()
    .notEmpty()
    .withMessage('parkName cannot be empty')
    .isString()
    .withMessage('parkName must be a string')
    .trim(),

  body('rowRange')
    .optional()
    .notEmpty()
    .withMessage('rowRange cannot be empty')
    .isString()
    .withMessage('rowRange must be a string')
    .trim(),

  body('area')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('area must be a number greater than or equal to 0'),

  body('avocadoVariety')
    .optional()
    .isArray({ min: 1 })
    .withMessage('avocadoVariety must be a non-empty array of strings'),
  body('avocadoVariety.*')
    .isString()
    .withMessage('each variety must be a string')
    .trim(),

  body('status')
    .optional()
    .isIn(Object.values(ParkStatus))
    .withMessage(`status must be one of: ${Object.values(ParkStatus).join(', ')}`),

  body('comments')
    .optional({ nullable: true })
    .isString()
    .withMessage('comments must be a string')
    .trim(),
];

export const parkIdParamValidator = [
  param('parkId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('parkId must be a valid ObjectId');
      }
      return true;
    }),
];

export const getParksValidator = [
  query('parentValve')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('parentValve must be a valid ObjectId');
      }
      return true;
    }),

  query('parentPlot')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('parentPlot must be a valid ObjectId');
      }
      return true;
    }),

  query('parentFarm')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('parentFarm must be a valid ObjectId');
      }
      return true;
    }),

  query('status')
    .optional()
    .isIn(Object.values(ParkStatus))
    .withMessage(`status must be one of: ${Object.values(ParkStatus).join(', ')}`),

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

export const getParksByValveIdValidator = [
  param('valveId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('valveId must be a valid ObjectId');
      }
      return true;
    }),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('limit must be an integer >= 1'),
];

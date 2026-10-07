import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';
import { PlotStatus } from '../../models/plot.model.ts';

export const createPlotValidator = [
  body('parentFarm')
    .notEmpty()
    .withMessage('parentFarm is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('parentFarm must be a valid ObjectId');
      }
      return true;
    }),

  body('plotName')
    .notEmpty()
    .withMessage('plotName is required')
    .isString()
    .withMessage('plotName must be a string')
    .trim(),

  body('totalArea')
    .notEmpty()
    .withMessage('totalArea is required')
    .isFloat({ min: 0 })
    .withMessage('totalArea must be a number greater than or equal to 0'),

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
    .isIn(Object.values(PlotStatus))
    .withMessage(`status must be one of: ${Object.values(PlotStatus).join(', ')}`),

  body('comments')
    .optional({ nullable: true })
    .isString()
    .withMessage('comments must be a string')
    .trim(),
];

export const updatePlotValidator = [
  param('plotId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('plotId must be a valid ObjectId');
      }
      return true;
    }),

  body('parentFarm')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('parentFarm must be a valid ObjectId');
      }
      return true;
    }),

  body('plotName')
    .optional()
    .notEmpty()
    .withMessage('plotName cannot be empty')
    .isString()
    .withMessage('plotName must be a string')
    .trim(),

  body('totalArea')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('totalArea must be a number greater than or equal to 0'),

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
    .isIn(Object.values(PlotStatus))
    .withMessage(`status must be one of: ${Object.values(PlotStatus).join(', ')}`),

  body('comments')
    .optional({ nullable: true })
    .isString()
    .withMessage('comments must be a string')
    .trim(),
];

export const plotIdParamValidator = [
  param('plotId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('plotId must be a valid ObjectId');
      }
      return true;
    }),
];

export const getPlotsValidator = [
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
    .isIn(Object.values(PlotStatus))
    .withMessage(`status must be one of: ${Object.values(PlotStatus).join(', ')}`),

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

export const getPlotsByFarmIdValidator = [
  param('farmId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('farmId must be a valid ObjectId');
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

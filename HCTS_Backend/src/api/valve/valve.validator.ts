import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';
import { ValveStatus } from '../../models/valve.model.ts';

export const createValveValidator = [
  body('parentPlot')
    .notEmpty()
    .withMessage('parentPlot is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('parentPlot must be a valid ObjectId');
      }
      return true;
    }),

  body('valveName')
    .notEmpty()
    .withMessage('valveName is required')
    .isString()
    .withMessage('valveName must be a string')
    .trim(),

  body('irrigationArea')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('irrigationArea must be a number greater than or equal to 0'),

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
    .isIn(Object.values(ValveStatus))
    .withMessage(`status must be one of: ${Object.values(ValveStatus).join(', ')}`),

  body('comments')
    .optional({ nullable: true })
    .isString()
    .withMessage('comments must be a string')
    .trim(),
];

export const updateValveValidator = [
  param('valveId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('valveId must be a valid ObjectId');
      }
      return true;
    }),

  body('parentPlot')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('parentPlot must be a valid ObjectId');
      }
      return true;
    }),

  body('valveName')
    .optional()
    .notEmpty()
    .withMessage('valveName cannot be empty')
    .isString()
    .withMessage('valveName must be a string')
    .trim(),

  body('irrigationArea')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('irrigationArea must be a number greater than or equal to 0'),

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
    .isIn(Object.values(ValveStatus))
    .withMessage(`status must be one of: ${Object.values(ValveStatus).join(', ')}`),

  body('comments')
    .optional({ nullable: true })
    .isString()
    .withMessage('comments must be a string')
    .trim(),
];

export const valveIdParamValidator = [
  param('valveId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('valveId must be a valid ObjectId');
      }
      return true;
    }),
];

export const getValvesValidator = [
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
    .isIn(Object.values(ValveStatus))
    .withMessage(`status must be one of: ${Object.values(ValveStatus).join(', ')}`),

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

export const getValvesByPlotIdValidator = [
  param('plotId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('plotId must be a valid ObjectId');
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

import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';
import { ForecastStatus } from '../../models/harvestForecast.model.ts';

export const createForecastValidator = [
  body('campaign')
    .notEmpty()
    .withMessage('* (Required) campaign is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('campaign must be a valid ObjectId'),

  body('farm')
    .notEmpty()
    .withMessage('* (Required) farm is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('farm must be a valid ObjectId'),

  body('plot')
    .notEmpty()
    .withMessage('* (Required) plot is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('plot must be a valid ObjectId'),

  body('valve')
    .optional({ nullable: true })
    .custom((value) => value === null || Types.ObjectId.isValid(value))
    .withMessage('valve must be a valid ObjectId or null'),

  body('park')
    .optional({ nullable: true })
    .custom((value) => value === null || Types.ObjectId.isValid(value))
    .withMessage('park must be a valid ObjectId or null'),


  body('variety')
    .notEmpty()
    .withMessage('* (Required) variety is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('variety must be a valid ObjectId'),

  body('surfaceArea')
    .notEmpty()
    .withMessage('* (Required) surfaceArea is required')
    .isFloat({ min: 0.0001 })
    .withMessage('surfaceArea must be a number greater than 0'),

  body('estimatedKg')
    .notEmpty()
    .withMessage('* (Required) estimatedKg is required')
    .isFloat({ min: 0 })
    .withMessage('estimatedKg must be a non-negative number'),

  body('recordDate')
    .optional()
    .isISO8601()
    .withMessage('recordDate must be a valid ISO8601 date string'),



  body('status')
    .optional()
    .isIn(Object.values(ForecastStatus))
    .withMessage(`status must be one of: ${Object.values(ForecastStatus).join(', ')}`),

  body('comments')
    .optional()
    .isString()
    .withMessage('comments must be a string')
    .trim(),
];

export const updateForecastValidator = [
  param('forecastId')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('forecastId must be a valid ObjectId'),

  body('campaign')
    .optional()
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('campaign must be a valid ObjectId'),

  body('farm')
    .optional()
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('farm must be a valid ObjectId'),

  body('plot')
    .optional()
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('plot must be a valid ObjectId'),

  body('valve')
    .optional({ nullable: true })
    .custom((value) => value === null || Types.ObjectId.isValid(value))
    .withMessage('valve must be a valid ObjectId or null'),

  body('park')
    .optional({ nullable: true })
    .custom((value) => value === null || Types.ObjectId.isValid(value))
    .withMessage('park must be a valid ObjectId or null'),


  body('variety')
    .optional()
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('variety must be a valid ObjectId'),

  body('surfaceArea')
    .optional()
    .isFloat({ min: 0.0001 })
    .withMessage('surfaceArea must be a number greater than 0'),

  body('estimatedKg')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('estimatedKg must be a non-negative number'),

  body('recordDate')
    .optional()
    .isISO8601()
    .withMessage('recordDate must be a valid ISO8601 date string'),



  body('status')
    .optional()
    .isIn(Object.values(ForecastStatus))
    .withMessage(`status must be one of: ${Object.values(ForecastStatus).join(', ')}`),

  body('comments')
    .optional()
    .isString()
    .withMessage('comments must be a string')
    .trim(),
];

export const forecastIdParamValidator = [
  param('forecastId')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('forecastId must be a valid ObjectId'),
];

export const listForecastValidator = [
  query('campaignId')
    .optional()
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('campaignId must be a valid ObjectId'),

  query('farmId')
    .optional()
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('farmId must be a valid ObjectId'),

  query('plotId')
    .optional()
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('plotId must be a valid ObjectId'),

  query('varietyId')
    .optional()
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('varietyId must be a valid ObjectId'),

  query('status')
    .optional()
    .isIn(Object.values(ForecastStatus))
    .withMessage(`status must be one of: ${Object.values(ForecastStatus).join(', ')}`),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('limit must be an integer >= 1'),
];

export const mockReceiptsValidator = [
  body('campaign')
    .notEmpty()
    .withMessage('* (Required) campaign is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('campaign must be a valid ObjectId'),

  body('farm')
    .notEmpty()
    .withMessage('* (Required) farm is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('farm must be a valid ObjectId'),

  body('plot')
    .notEmpty()
    .withMessage('* (Required) plot is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('plot must be a valid ObjectId'),

  body('valve')
    .optional({ nullable: true })
    .custom((value) => value === null || Types.ObjectId.isValid(value))
    .withMessage('valve must be a valid ObjectId or null'),

  body('park')
    .optional({ nullable: true })
    .custom((value) => value === null || Types.ObjectId.isValid(value))
    .withMessage('park must be a valid ObjectId or null'),

  body('variety')
    .notEmpty()
    .withMessage('* (Required) variety is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('variety must be a valid ObjectId'),

  body('harvestedKg')
    .notEmpty()
    .withMessage('* (Required) harvestedKg is required')
    .isFloat({ min: 0 })
    .withMessage('harvestedKg must be a non-negative number'),
];

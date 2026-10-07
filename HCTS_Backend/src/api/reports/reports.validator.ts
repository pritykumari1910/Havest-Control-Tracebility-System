import { query } from 'express-validator';
import { Types } from 'mongoose';

export const getHarvestProgressValidator = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date string'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO8601 date string'),

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

  query('varietyId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('varietyId must be a valid ObjectId');
      }
      return true;
    }),

  query('crewId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('crewId must be a valid ObjectId');
      }
      return true;
    }),

  query('supervisorId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('supervisorId must be a valid ObjectId');
      }
      return true;
    }),

  query('groupBy')
    .optional()
    .isIn(['crew', 'assignment', 'variety', 'farm', 'plot', 'valve', 'park', 'campaign'])
    .withMessage('groupBy must be one of: crew, assignment, variety, farm, plot, valve, park, campaign'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer >= 1')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('limit must be an integer between 1 and 500')
    .toInt(),
];

export const exportHarvestProgressValidator = [
  ...getHarvestProgressValidator,
  query('format')
    .optional()
    .isIn(['excel', 'csv', 'pdf', 'json'])
    .withMessage('format must be one of: excel, csv, pdf, json'),
];

export const getForecastVsActualValidator = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date string'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO8601 date string'),

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

  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('period must be one of: daily, weekly, monthly'),
];

export const getHarvestReceiptScansValidator = [
  query('qrCode')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('qrCode must be a non-empty string'),

  query('crewId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('crewId must be a valid ObjectId');
      }
      return true;
    }),

  query('machineId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('machineId must be a valid ObjectId');
      }
      return true;
    }),

  query('varietyId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('varietyId must be a valid ObjectId');
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

  query('date')
    .optional()
    .isISO8601()
    .withMessage('date must be a valid ISO8601 date string'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date string'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO8601 date string'),

  query('dispatchNoteStatus')
    .optional()
    .isIn(['draft', 'closed', 'associated_to_load_order', 'dispatched', 'pending_buyer_note', 'reconciled'])
    .withMessage(
      'dispatchNoteStatus must be one of: draft, closed, associated_to_load_order, dispatched, pending_buyer_note, reconciled'
    ),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer >= 1')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('limit must be an integer between 1 and 500')
    .toInt(),
];

export const getTransferOrdersReportValidator = [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('date must be a valid ISO8601 date string'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date string'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO8601 date string'),

  query('buyerId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('buyerId must be a valid ObjectId');
      }
      return true;
    }),

  query('destinationId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('destinationId must be a valid ObjectId');
      }
      return true;
    }),

  query('transportProviderId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('transportProviderId must be a valid ObjectId');
      }
      return true;
    }),

  query('status')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('status must be a non-empty string'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer >= 1')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('limit must be an integer between 1 and 500')
    .toInt(),
];

export const getDispatchNotesReportValidator = [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('date must be a valid ISO8601 date string'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date string'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO8601 date string'),

  query('buyerId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('buyerId must be a valid ObjectId');
      }
      return true;
    }),

  query('destinationId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('destinationId must be a valid ObjectId');
      }
      return true;
    }),

  query('campaignId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('campaignId must be a valid ObjectId');
      }
      return true;
    }),

  query('transportProviderId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('transportProviderId must be a valid ObjectId');
      }
      return true;
    }),

  query('status')
    .optional()
    .isIn(['draft', 'closed', 'associated_to_load_order', 'dispatched', 'pending_buyer_note', 'reconciled'])
    .withMessage('status must be one of: draft, closed, associated_to_load_order, dispatched, pending_buyer_note, reconciled'),

  query('search')
    .optional()
    .isString()
    .trim(),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer >= 1')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('limit must be an integer between 1 and 500')
    .toInt(),
];

export const exportDispatchNotesReportValidator = [
  ...getDispatchNotesReportValidator,
  query('format')
    .optional()
    .isIn(['excel', 'csv', 'pdf', 'json'])
    .withMessage('format must be one of: excel, csv, pdf, json'),
];

import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';
import { PrinterStatus } from '../../models/qrSeries.model.ts';
import { QrInventoryStatus } from '../../models/qrInventory.model.ts';

export const createSeriesValidator = [
  body('seriesName')
    .notEmpty()
    .withMessage('* (Required) seriesName is required')
    .isString()
    .withMessage('seriesName must be a string')
    .trim(),

  body('startNumber')
    .notEmpty()
    .withMessage('* (Required) startNumber is required')
    .isInt({ min: 1 })
    .withMessage('startNumber must be an integer greater than or equal to 1'),

  body('endNumber')
    .notEmpty()
    .withMessage('* (Required) endNumber is required')
    .isInt({ min: 1 })
    .withMessage('endNumber must be an integer greater than or equal to 1')
    .custom((value, { req }) => {
      if (req.body.startNumber && Number(value) < Number(req.body.startNumber)) {
        throw new Error('endNumber must be greater than or equal to startNumber');
      }
      return true;
    }),

  body('comments')
    .optional()
    .isString()
    .withMessage('comments must be a string')
    .trim(),
];

export const printerOrderValidator = [
  body('sentToPrinterDate')
    .optional()
    .isISO8601()
    .withMessage('sentToPrinterDate must be a valid ISO8601 date string'),

  body('printerName')
    .optional()
    .isString()
    .withMessage('printerName must be a string')
    .trim(),

  body('fileReference')
    .optional()
    .isString()
    .withMessage('fileReference must be a string')
    .trim(),

  body('printerStatus')
    .optional()
    .isIn(Object.values(PrinterStatus))
    .withMessage(`printerStatus must be one of: ${Object.values(PrinterStatus).join(', ')}`),
];

export const registerReceiptValidator = [
  body('dateReceived')
    .optional()
    .isISO8601()
    .withMessage('dateReceived must be a valid ISO8601 date string'),

  body('quantityReceived')
    .optional()
    .isInt({ min: 0 })
    .withMessage('quantityReceived must be a non-negative integer'),

  body('responsiblePerson')
    .optional()
    .isString()
    .withMessage('responsiblePerson must be a string')
    .trim(),

  body('printingIssues')
    .optional()
    .isString()
    .withMessage('printingIssues must be a string')
    .trim(),

  body('qualityCheckResult')
    .optional()
    .isString()
    .withMessage('qualityCheckResult must be a string')
    .trim(),
];

export const seriesIdParamValidator = [
  param('seriesId').custom((value) => {
    if (!Types.ObjectId.isValid(value)) {
      throw new Error('seriesId must be a valid ObjectId');
    }
    return true;
  }),
];

export const listSeriesValidator = [
  query('search')
    .optional()
    .isString()
    .withMessage('search filter must be a string')
    .trim(),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer greater than or equal to 1'),
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('limit must be an integer greater than or equal to 1'),
];

export const listInventoryValidator = [
  query('seriesId')
    .optional()
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('seriesId must be a valid ObjectId');
      }
      return true;
    }),
  query('status')
    .optional()
    .isIn(Object.values(QrInventoryStatus))
    .withMessage(`status must be one of: ${Object.values(QrInventoryStatus).join(', ')}`),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date string'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO8601 date string'),
  query('harvestAssignmentId')
    .optional()
    .isString()
    .withMessage('harvestAssignmentId must be a string')
    .trim(),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer greater than or equal to 1'),
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('limit must be an integer greater than or equal to 1'),
];

export const updateSeriesValidator = [
  param('seriesId').custom((value) => {
    if (!Types.ObjectId.isValid(value)) {
      throw new Error('seriesId must be a valid ObjectId');
    }
    return true;
  }),

  body('seriesName')
    .optional()
    .notEmpty()
    .withMessage('seriesName cannot be empty')
    .isString()
    .withMessage('seriesName must be a string')
    .trim(),

  body('comments')
    .optional({ nullable: true })
    .isString()
    .withMessage('comments must be a string')
    .trim(),

  body('printerName')
    .optional()
    .isString()
    .withMessage('printerName must be a string')
    .trim(),
];

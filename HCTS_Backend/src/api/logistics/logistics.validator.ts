import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';
import { BuyerStatus } from '../../models/buyer.model.ts';
import { DestinationCenterStatus } from '../../models/destinationCenter.model.ts';
import { TransportProviderStatus } from '../../models/transportProvider.model.ts';

// Buyers
export const createBuyerValidator = [
  body('name')
    .notEmpty()
    .withMessage('* (Required) name is required')
    .isString()
    .withMessage('name must be a string')
    .trim(),

  body('internalCode')
    .optional()
    .isString()
    .withMessage('internalCode must be a string')
    .trim(),

  body('contactDetails')
    .optional()
    .isObject()
    .withMessage('contactDetails must be an object'),

  body('contactDetails.email')
    .optional()
    .isEmail()
    .withMessage('contactDetails.email must be a valid email address'),

  body('contactDetails.phone')
    .optional()
    .isString()
    .withMessage('contactDetails.phone must be a string'),

  body('contactDetails.address')
    .optional()
    .isString()
    .withMessage('contactDetails.address must be a string'),

  body('status')
    .optional()
    .isIn(Object.values(BuyerStatus))
    .withMessage(`status must be one of: ${Object.values(BuyerStatus).join(', ')}`),
];

export const updateBuyerValidator = [
  param('buyerId')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('buyerId must be a valid ObjectId'),

  body('name')
    .optional()
    .isString()
    .withMessage('name must be a string')
    .trim(),

  body('internalCode')
    .optional()
    .isString()
    .withMessage('internalCode must be a string')
    .trim(),

  body('contactDetails')
    .optional()
    .isObject()
    .withMessage('contactDetails must be an object'),

  body('contactDetails.email')
    .optional()
    .isEmail()
    .withMessage('contactDetails.email must be a valid email address'),

  body('contactDetails.phone')
    .optional()
    .isString()
    .withMessage('contactDetails.phone must be a string'),

  body('contactDetails.address')
    .optional()
    .isString()
    .withMessage('contactDetails.address must be a string'),

  body('status')
    .optional()
    .isIn(Object.values(BuyerStatus))
    .withMessage(`status must be one of: ${Object.values(BuyerStatus).join(', ')}`),
];

// Destinations
export const createDestinationValidator = [
  body('name')
    .notEmpty()
    .withMessage('* (Required) name is required')
    .isString()
    .withMessage('name must be a string')
    .trim(),

  body('internalCode')
    .optional()
    .isString()
    .withMessage('internalCode must be a string')
    .trim(),

  body('contactDetails')
    .optional()
    .isObject()
    .withMessage('contactDetails must be an object'),

  body('contactDetails.email')
    .optional()
    .isEmail()
    .withMessage('contactDetails.email must be a valid email address'),

  body('contactDetails.phone')
    .optional()
    .isString()
    .withMessage('contactDetails.phone must be a string'),

  body('contactDetails.address')
    .optional()
    .isString()
    .withMessage('contactDetails.address must be a string'),

  body('status')
    .optional()
    .isIn(Object.values(DestinationCenterStatus))
    .withMessage(`status must be one of: ${Object.values(DestinationCenterStatus).join(', ')}`),
];

export const updateDestinationValidator = [
  param('destId')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('destId must be a valid ObjectId'),

  body('name')
    .optional()
    .isString()
    .withMessage('name must be a string')
    .trim(),

  body('internalCode')
    .optional()
    .isString()
    .withMessage('internalCode must be a string')
    .trim(),

  body('contactDetails')
    .optional()
    .isObject()
    .withMessage('contactDetails must be an object'),

  body('contactDetails.email')
    .optional()
    .isEmail()
    .withMessage('contactDetails.email must be a valid email address'),

  body('contactDetails.phone')
    .optional()
    .isString()
    .withMessage('contactDetails.phone must be a string'),

  body('contactDetails.address')
    .optional()
    .isString()
    .withMessage('contactDetails.address must be a string'),

  body('status')
    .optional()
    .isIn(Object.values(DestinationCenterStatus))
    .withMessage(`status must be one of: ${Object.values(DestinationCenterStatus).join(', ')}`),
];

// Transport Providers
export const createTransportValidator = [
  body('legalName')
    .notEmpty()
    .withMessage('* (Required) legalName is required')
    .isString()
    .withMessage('legalName must be a string')
    .trim(),

  body('contactDetails')
    .optional()
    .isObject()
    .withMessage('contactDetails must be an object'),

  body('contactDetails.email')
    .optional()
    .isEmail()
    .withMessage('contactDetails.email must be a valid email address'),

  body('contactDetails.phone')
    .optional()
    .isString()
    .withMessage('contactDetails.phone must be a string'),

  body('contactDetails.address')
    .optional()
    .isString()
    .withMessage('contactDetails.address must be a string'),

  body('status')
    .optional()
    .isIn(Object.values(TransportProviderStatus))
    .withMessage(`status must be one of: ${Object.values(TransportProviderStatus).join(', ')}`),
];

export const updateTransportValidator = [
  param('providerId')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('providerId must be a valid ObjectId'),

  body('legalName')
    .optional()
    .isString()
    .withMessage('legalName must be a string')
    .trim(),

  body('contactDetails')
    .optional()
    .isObject()
    .withMessage('contactDetails must be an object'),

  body('contactDetails.email')
    .optional()
    .isEmail()
    .withMessage('contactDetails.email must be a valid email address'),

  body('contactDetails.phone')
    .optional()
    .isString()
    .withMessage('contactDetails.phone must be a string'),

  body('contactDetails.address')
    .optional()
    .isString()
    .withMessage('contactDetails.address must be a string'),

  body('status')
    .optional()
    .isIn(Object.values(TransportProviderStatus))
    .withMessage(`status must be one of: ${Object.values(TransportProviderStatus).join(', ')}`),
];

// Dispatch Notes
export const createDispatchNoteValidator = [
  body('campaign')
    .notEmpty()
    .withMessage('* (Required) campaign is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('campaign must be a valid ObjectId'),

  body('buyer')
    .notEmpty()
    .withMessage('* (Required) buyer is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('buyer must be a valid ObjectId'),

  body('destination')
    .notEmpty()
    .withMessage('* (Required) destination is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('destination must be a valid ObjectId'),

  body('noteDate')
    .optional()
    .isISO8601()
    .withMessage('noteDate must be a valid ISO8601 date'),
];

export const getDispatchNotesValidator = [
  query('status')
    .optional()
    .isString()
    .trim(),

  query('campaign')
    .optional()
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('campaign must be a valid ObjectId'),

  query('buyer')
    .optional()
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('buyer must be a valid ObjectId'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('limit must be between 1 and 100'),
];

export const noteIdParamValidator = [
  param('noteId')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('noteId must be a valid ObjectId'),
];

export const updateDispatchNoteValidator = [
  param('noteId')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('noteId must be a valid ObjectId'),

  body('campaign')
    .optional()
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('campaign must be a valid ObjectId'),

  body('buyer')
    .optional()
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('buyer must be a valid ObjectId'),

  body('destination')
    .optional()
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('destination must be a valid ObjectId'),

  body('noteDate')
    .optional()
    .isISO8601()
    .withMessage('noteDate must be a valid ISO8601 date'),
];

export const associateBinsValidator = [
  param('noteId')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('noteId must be a valid ObjectId'),

  body('binIds')
    .isArray({ min: 1 })
    .withMessage('binIds must be a non-empty array')
    .custom((arr) => arr.every((val: any) => Types.ObjectId.isValid(val)))
    .withMessage('binIds must contain only valid ObjectIds'),
];

export const removeBinValidator = [
  param('noteId')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('noteId must be a valid ObjectId'),

  param('binId')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('binId must be a valid ObjectId'),

  body('reason')
    .notEmpty()
    .withMessage('reason is required when removing a bin')
    .isString()
    .trim(),
];

export const exportSummaryValidator = [
  param('noteId')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('noteId must be a valid ObjectId'),

  query('format')
    .notEmpty()
    .withMessage('format is required')
    .isIn(['pdf', 'excel', 'csv'])
    .withMessage("format must be one of: 'pdf', 'excel', 'csv'"),
];

// Transfer Orders
export const createTransferOrderValidator = [
  body('transferCode')
    .optional()
    .isString()
    .withMessage('transferCode must be a string')
    .trim(),

  body('transportProvider')
    .notEmpty()
    .withMessage('* (Required) transportProvider is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('transportProvider must be a valid ObjectId'),

  body('dispatchNotes')
    .notEmpty()
    .withMessage('* (Required) dispatchNotes is required')
    .isArray({ min: 1 })
    .withMessage('dispatchNotes must be a non-empty array of ObjectIds')
    .custom((arr) => arr.every((val: any) => Types.ObjectId.isValid(val)))
    .withMessage('dispatchNotes must contain only valid ObjectIds'),
];

export const buyerIdParamValidator = [
  param('buyerId')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('buyerId must be a valid ObjectId'),
];

export const destIdParamValidator = [
  param('destId')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('destId must be a valid ObjectId'),
];

export const providerIdParamValidator = [
  param('providerId')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('providerId must be a valid ObjectId'),
];

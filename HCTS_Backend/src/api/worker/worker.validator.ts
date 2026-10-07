import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';
import { DocumentIdType, WorkerStatus } from '../../models/worker.model.ts';

export const createWorkerValidator = [
  body('firstName')
    .notEmpty()
    .withMessage('firstName is required')
    .isString()
    .withMessage('firstName must be a string')
    .trim(),

  body('lastName')
    .notEmpty()
    .withMessage('lastName is required')
    .isString()
    .withMessage('lastName must be a string')
    .trim(),

  body('documentIdType')
    .notEmpty()
    .withMessage('documentIdType is required')
    .isIn(Object.values(DocumentIdType))
    .withMessage(`documentIdType must be one of: ${Object.values(DocumentIdType).join(', ')}`),

  body('documentIdNumber')
    .notEmpty()
    .withMessage('documentIdNumber is required')
    .isString()
    .withMessage('documentIdNumber must be a string')
    .trim()
    .custom((value, { req }) => {
      const docType = req.body.documentIdType;
      if (docType === DocumentIdType.DNI) {
        if (!/^\d{8}[A-Za-z]$/.test(value)) {
          throw new Error('DNI must be 8 digits followed by 1 letter (e.g., 12345678A)');
        }
      } else if (docType === DocumentIdType.NIE) {
        if (!/^[XYZxyz]\d{7}[A-Za-z]$/.test(value)) {
          throw new Error('NIE must start with X, Y, or Z, followed by 7 digits and 1 letter (e.g., X1234567A)');
        }
      }
      return true;
    }),

  body('employmentCompany')
    .notEmpty()
    .withMessage('employmentCompany is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('employmentCompany must be a valid ObjectId');
      }
      return true;
    }),

  body('phoneNumber')
    .optional({ nullable: true })
    .isString()
    .withMessage('phoneNumber must be a string')
    .trim()
    .matches(/^\+?[1-9]\d{9,12}$/)
    .withMessage('phoneNumber must be a valid phone number with country code, between 10 and 13 digits (e.g. +911234567890)'),

  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('email must be a valid email address')
    .normalizeEmail(),

  body('status')
    .optional()
    .isIn(Object.values(WorkerStatus))
    .withMessage(`status must be one of: ${Object.values(WorkerStatus).join(', ')}`),
];

export const updateWorkerValidator = [
  param('workerId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('workerId must be a valid ObjectId');
      }
      return true;
    }),

  body('firstName')
    .optional()
    .notEmpty()
    .withMessage('firstName cannot be empty')
    .isString()
    .withMessage('firstName must be a string')
    .trim(),

  body('lastName')
    .optional()
    .notEmpty()
    .withMessage('lastName cannot be empty')
    .isString()
    .withMessage('lastName must be a string')
    .trim(),

  body('documentIdType')
    .optional()
    .isIn(Object.values(DocumentIdType))
    .withMessage(`documentIdType must be one of: ${Object.values(DocumentIdType).join(', ')}`),

  body('documentIdNumber')
    .optional()
    .notEmpty()
    .withMessage('documentIdNumber cannot be empty')
    .isString()
    .withMessage('documentIdNumber must be a string')
    .trim()
    .custom(async (value, { req }) => {
      let docType = req.body.documentIdType;
      if (!docType) {
        const workerId = req.params?.workerId;
        const WorkerModel = (await import('../../models/worker.model.ts')).default;
        const worker = await WorkerModel.findById(workerId);
        docType = worker?.documentIdType;
      }
      if (docType === DocumentIdType.DNI) {
        if (!/^\d{8}[A-Za-z]$/.test(value)) {
          throw new Error('DNI must be 8 digits followed by 1 letter (e.g., 12345678A)');
        }
      } else if (docType === DocumentIdType.NIE) {
        if (!/^[XYZxyz]\d{7}[A-Za-z]$/.test(value)) {
          throw new Error('NIE must start with X, Y, or Z, followed by 7 digits and 1 letter (e.g., X1234567A)');
        }
      }
      return true;
    }),

  body('employmentCompany')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('employmentCompany must be a valid ObjectId');
      }
      return true;
    }),

  body('phoneNumber')
    .optional({ nullable: true })
    .isString()
    .withMessage('phoneNumber must be a string')
    .trim()
    .matches(/^\+?[1-9]\d{9,12}$/)
    .withMessage('phoneNumber must be a valid phone number with country code, between 10 and 13 digits (e.g. +911234567890)'),

  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('email must be a valid email address')
    .normalizeEmail(),

  body('status')
    .optional()
    .isIn(Object.values(WorkerStatus))
    .withMessage(`status must be one of: ${Object.values(WorkerStatus).join(', ')}`),
];

export const workerIdParamValidator = [
  param('workerId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('workerId must be a valid ObjectId');
      }
      return true;
    }),
];

export const getWorkersValidator = [
  query('employmentCompany')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('employmentCompany must be a valid ObjectId');
      }
      return true;
    }),

  query('status')
    .optional()
    .isIn(Object.values(WorkerStatus))
    .withMessage(`status must be one of: ${Object.values(WorkerStatus).join(', ')}`),

  query('documentIdType')
    .optional()
    .isIn(Object.values(DocumentIdType))
    .withMessage(`documentIdType must be one of: ${Object.values(DocumentIdType).join(', ')}`),

  query('search')
    .optional()
    .isString()
    .withMessage('search must be a string'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer greater than or equal to 1')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100')
    .toInt(),
];

export const companyIdParamValidator = [
  param('companyId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('companyId must be a valid ObjectId');
      }
      return true;
    }),
];

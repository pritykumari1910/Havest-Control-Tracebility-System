import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';
import { EmploymentCompanyStatus } from '../../models/employmentCompany.model.ts';

export const createCompanyValidator = [
  body('companyName')
    .notEmpty()
    .withMessage('companyName is required')
    .isString()
    .withMessage('companyName must be a string')
    .trim(),

  body('taxId')
    .notEmpty()
    .withMessage('taxId is required')
    .isString()
    .withMessage('taxId must be a string')
    .trim(),

  body('contactPerson')
    .notEmpty()
    .withMessage('contactPerson is required')
    .isString()
    .withMessage('contactPerson must be a string')
    .trim(),

  body('phoneNumber')
    .notEmpty()
    .withMessage('phoneNumber is required')
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
    .isIn(Object.values(EmploymentCompanyStatus))
    .withMessage(`status must be one of: ${Object.values(EmploymentCompanyStatus).join(', ')}`),

  body('comments')
    .optional({ nullable: true })
    .isString()
    .withMessage('comments must be a string')
    .trim(),
];

export const updateCompanyValidator = [
  param('companyId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('companyId must be a valid ObjectId');
      }
      return true;
    }),

  body('companyName')
    .optional()
    .notEmpty()
    .withMessage('companyName cannot be empty')
    .isString()
    .withMessage('companyName must be a string')
    .trim(),

  body('taxId')
    .optional()
    .notEmpty()
    .withMessage('taxId cannot be empty')
    .isString()
    .withMessage('taxId must be a string')
    .trim(),

  body('contactPerson')
    .optional()
    .notEmpty()
    .withMessage('contactPerson cannot be empty')
    .isString()
    .withMessage('contactPerson must be a string')
    .trim(),

  body('phoneNumber')
    .optional()
    .notEmpty()
    .withMessage('phoneNumber cannot be empty')
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
    .isIn(Object.values(EmploymentCompanyStatus))
    .withMessage(`status must be one of: ${Object.values(EmploymentCompanyStatus).join(', ')}`),

  body('comments')
    .optional({ nullable: true })
    .isString()
    .withMessage('comments must be a string')
    .trim(),
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

export const getCompaniesValidator = [
  query('status')
    .optional()
    .isIn(Object.values(EmploymentCompanyStatus))
    .withMessage(`status must be one of: ${Object.values(EmploymentCompanyStatus).join(', ')}`),

  query('search')
    .optional()
    .isString()
    .withMessage('search must be a string'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer greater than or equal to 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100'),
];

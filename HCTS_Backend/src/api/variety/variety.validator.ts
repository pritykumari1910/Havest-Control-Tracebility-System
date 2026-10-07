import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';
import { VarietyStatus, VarietyType } from '../../models/variety.model.ts';

export const createVarietyValidator = [
  body('varietyName')
    .notEmpty()
    .withMessage('varietyName is required')
    .isString()
    .withMessage('varietyName must be a string')
    .trim(),

  body('varietyType')
    .notEmpty()
    .withMessage('varietyType is required')
    .isIn(Object.values(VarietyType))
    .withMessage(`varietyType must be one of: ${Object.values(VarietyType).join(', ')}`),

  body('otherVarietyType')
    .optional({ nullable: true })
    .isString()
    .withMessage('otherVarietyType must be a string')
    .trim()
    .custom((value, { req }) => {
      if (req.body.varietyType === VarietyType.OTHER && (!value || value.trim() === '')) {
        throw new Error('otherVarietyType is required when varietyType is Other');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(Object.values(VarietyStatus))
    .withMessage(`status must be one of: ${Object.values(VarietyStatus).join(', ')}`),

  body('technicalComments')
    .optional({ nullable: true })
    .isString()
    .withMessage('technicalComments must be a string')
    .trim(),
];

export const updateVarietyValidator = [
  param('varietyId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('varietyId must be a valid ObjectId');
      }
      return true;
    }),

  body('varietyName')
    .optional()
    .notEmpty()
    .withMessage('varietyName cannot be empty')
    .isString()
    .withMessage('varietyName must be a string')
    .trim(),

  body('varietyType')
    .optional()
    .isIn(Object.values(VarietyType))
    .withMessage(`varietyType must be one of: ${Object.values(VarietyType).join(', ')}`),

  body('otherVarietyType')
    .optional({ nullable: true })
    .isString()
    .withMessage('otherVarietyType must be a string')
    .trim(),

  body('status')
    .optional()
    .isIn(Object.values(VarietyStatus))
    .withMessage(`status must be one of: ${Object.values(VarietyStatus).join(', ')}`),

  body('technicalComments')
    .optional({ nullable: true })
    .isString()
    .withMessage('technicalComments must be a string')
    .trim(),
];

export const varietyIdParamValidator = [
  param('varietyId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('varietyId must be a valid ObjectId');
      }
      return true;
    }),
];

export const getVarietiesValidator = [
  query('varietyType')
    .optional()
    .isIn(Object.values(VarietyType))
    .withMessage(`varietyType must be one of: ${Object.values(VarietyType).join(', ')}`),

  query('status')
    .optional()
    .isIn(Object.values(VarietyStatus))
    .withMessage(`status must be one of: ${Object.values(VarietyStatus).join(', ')}`),
];

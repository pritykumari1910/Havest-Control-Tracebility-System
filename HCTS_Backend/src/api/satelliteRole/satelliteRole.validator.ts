import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';

export const createSatelliteRoleValidator = [
  body('name')
    .notEmpty()
    .withMessage('name is required')
    .isString()
    .withMessage('name must be a string')
    .trim(),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const updateSatelliteRoleValidator = [
  param('roleId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('roleId must be a valid ObjectId');
      }
      return true;
    }),

  body('name')
    .optional()
    .notEmpty()
    .withMessage('name cannot be empty')
    .isString()
    .withMessage('name must be a string')
    .trim(),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

export const getSatelliteRolesValidator = [
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive must be true or false')
    .customSanitizer((value) => value === 'true'),
];

export const roleIdParamValidator = [
  param('roleId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('roleId must be a valid ObjectId');
      }
      return true;
    }),
];

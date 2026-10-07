import { body, param } from 'express-validator';
import { Types } from 'mongoose';

const objectIdRule = (field: string, location: 'body' | 'param' = 'body') => {
  const chain = location === 'param' ? param(field) : body(field);

  return chain.custom((value) => {
    if (!Types.ObjectId.isValid(value)) {
      throw new Error(`${field} must be a valid ObjectId`);
    }
    return true;
  });
};

const optionalObjectIdArrayRule = body('permissions')
  .optional()
  .isArray()
  .withMessage('permissions must be an array')
  .custom((permissions: string[]) => {
    const isValid = permissions.every((permissionId) => Types.ObjectId.isValid(permissionId));
    if (!isValid) {
      throw new Error('permissions must contain valid ObjectIds');
    }
    return true;
  });

export const createPermissionValidator = [
  body('permissionName')
    .notEmpty()
    .withMessage('permissionName is required'),

  body('permissionIdentifier')
    .notEmpty()
    .withMessage('permissionIdentifier is required'),
];

export const updatePermissionValidator = [
  objectIdRule('permissionId', 'param'),

  body('permissionName')
    .optional()
    .notEmpty()
    .withMessage('permissionName cannot be empty'),

  body('permissionIdentifier')
    .optional()
    .notEmpty()
    .withMessage('permissionIdentifier cannot be empty'),
];

export const deletePermissionValidator = [
  objectIdRule('permissionId', 'param'),
];

export const getRoleValidator = [
  objectIdRule('roleId', 'param'),
];

export const createRoleValidator = [
  body('name')
    .notEmpty()
    .withMessage('name is required'),

  body('roleType')
    .isIn(['web', 'app'])
    .withMessage('roleType must be web or app'),

  objectIdRule('createdByAdminId'),

  optionalObjectIdArrayRule,

  body('isSystem')
    .optional()
    .isBoolean()
    .withMessage('isSystem must be boolean'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean'),
];

export const updateRoleValidator = [
  objectIdRule('roleId', 'param'),

  body('name')
    .optional()
    .notEmpty()
    .withMessage('name cannot be empty'),

  body('roleType')
    .optional()
    .isIn(['web', 'app'])
    .withMessage('roleType must be web or app'),

  optionalObjectIdArrayRule,

  body('isSystem')
    .optional()
    .isBoolean()
    .withMessage('isSystem must be boolean'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean'),
];

export const deleteRoleValidator = [
  objectIdRule('roleId', 'param'),
];

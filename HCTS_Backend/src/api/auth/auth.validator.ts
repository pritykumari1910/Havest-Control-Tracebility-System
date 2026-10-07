import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';

const passwordRule = (field: string, required = true) => {
  const rule = body(field).trim();

  if (!required) {
    return rule.optional({ nullable: true });
  }

  return rule
    .isLength({ min: 8 })
    .withMessage(`${field} must be at least 8 characters`)
    .matches(/\d/)
    .withMessage(`${field} must contain at least one number`)
    .matches(/[a-zA-Z]/)
    .withMessage(`${field} must contain at least one letter`);
};

const emailRule = body('email')
  .isEmail()
  .withMessage('Valid email is required');

const userPortalRule = body('userportal')
  .isIn(['web', 'app', 'both'])
  .withMessage('userportal must be web, app, or both');

const optionalEmailRule = body('email')
  .optional({ nullable: true })
  .isEmail()
  .withMessage('Valid email is required');

const optionalUserPortalRule = body('userportal')
  .optional({ nullable: true })
  .isIn(['web', 'app', 'both'])
  .withMessage('userportal must be web, app, or both');

const optionalPhoneRule = body('phoneNumber')
  .optional({ nullable: true })
  .trim()
  .matches(/^\+?\d{10,13}$/)
  .withMessage('phoneNumber must be a valid phone number, between 10 and 13 digits');

const objectIdParamRule = (field: string) =>
  param(field).custom((value) => {
    if (!Types.ObjectId.isValid(value)) {
      throw new Error(`${field} must be a valid ObjectId`);
    }
    return true;
  });

const optionalRoleIdsRule = body('roleIds')
  .optional()
  .isArray()
  .withMessage('roleIds must be an array')
  .custom((roleIds: string[]) => {
    const isValid = roleIds.every((roleId) => Types.ObjectId.isValid(roleId));
    if (!isValid) {
      throw new Error('roleIds must contain valid ObjectIds');
    }
    return true;
  });

const otpRule = body('otp')
  .isLength({ min: 6, max: 6 })
  .withMessage('Valid 6 digit OTP is required')
  .isNumeric()
  .withMessage('OTP must be numeric');

export const registerValidator = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required'),

  body('lastName')
    .notEmpty()
    .withMessage('Last name is required'),

  emailRule,

  optionalPhoneRule,

  optionalUserPortalRule,

  optionalRoleIdsRule,
];

export const addUserValidator = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required'),

  body('lastName')
    .notEmpty()
    .withMessage('Last name is required'),

  emailRule,

  optionalPhoneRule,

  passwordRule('password', false),

  optionalUserPortalRule,

  optionalRoleIdsRule,
];

export const updateUserValidator = [
  objectIdParamRule('userId'),

  body('firstName')
    .optional()
    .notEmpty()
    .withMessage('firstName cannot be empty'),

  body('lastName')
    .optional()
    .notEmpty()
    .withMessage('lastName cannot be empty'),

  optionalPhoneRule,

  body('userportal')
    .optional()
    .isIn(['web', 'app', 'both'])
    .withMessage('userportal must be web, app, or both'),

  optionalRoleIdsRule,
];

export const updateCurrentUserValidator = [
  body('firstName')
    .optional()
    .notEmpty()
    .withMessage('firstName cannot be empty'),

  body('lastName')
    .optional()
    .notEmpty()
    .withMessage('lastName cannot be empty'),

  optionalPhoneRule,
];

const VALID_ROLES = [
  'System Administrator',
  'Operations Director',
  'Field Engineer',
  'Farm Manager',
  'Manijero / Crew Supervisor',
  'Collection Team',
  'Loading Team',
  'Administrative Team',
  'Reporting User',
  'Read-Only User',
];

export const getAllUsersValidator = [
  query('roleId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('roleId must be a valid ObjectId');
      }
      return true;
    }),

  query('roleName')
    .optional()
    .trim()
    .isIn(VALID_ROLES)
    .withMessage(`roleName must be one of: ${VALID_ROLES.join(', ')}`),
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive must be true or false'),

  query('search')
    .optional()
    .isString()
    .withMessage('search must be a string'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer greater than 0'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100'),
];

export const userIdParamValidator = [
  objectIdParamRule('userId'),
];

export const loginValidator = [
  emailRule,

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  optionalUserPortalRule,
];

export const sendPasswordOtpValidator = [
  emailRule,

  optionalUserPortalRule,
];

export const forgotPasswordValidator = [
  emailRule,

  optionalUserPortalRule,
];

export const verifyOtpValidator = [
  emailRule,

  optionalUserPortalRule,

  otpRule,
];

export const resetPasswordValidator = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isString()
    .withMessage('Reset token must be a string'),

  passwordRule('newPassword'),
];

export const changePasswordValidator = [
  body('oldPassword')
    .exists()
    .withMessage('Old password is required')
    .trim()
    .notEmpty()
    .withMessage('Old password is required'),

  passwordRule('newPassword'),
];

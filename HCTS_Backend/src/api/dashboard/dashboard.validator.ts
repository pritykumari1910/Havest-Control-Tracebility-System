import { query } from 'express-validator';

export const getDashboardSummaryValidator = [
  query('userRoleId')
    .optional()
    .isString()
    .withMessage('userRoleId must be a string'),

  query('userRole')
    .optional()
    .isString()
    .withMessage('userRole must be a string'),

  query('date')
    .optional()
    .isISO8601()
    .withMessage('date must be a valid ISO8601 date string'),
];

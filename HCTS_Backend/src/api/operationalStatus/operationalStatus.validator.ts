import { query } from 'express-validator';

export const getOperationalStatusValidator = [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('date must be a valid ISO8601 date'),
];

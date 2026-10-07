import { query } from 'express-validator';

export const getSatelliteStaffReportValidator = [
  query('workDate')
    .optional()
    .isISO8601()
    .withMessage('workDate must be a valid ISO8601 date'),
];

import { query } from 'express-validator';
import { Types } from 'mongoose';

export const getAuditLogsValidator = [
  query('page')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('page must be an integer greater than 0'),

  query('limit')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100'),

  query('search')
    .optional({ nullable: true })
    .isString()
    .withMessage('search must be a string'),

  query('q')
    .optional({ nullable: true })
    .isString()
    .withMessage('q must be a string'),

  query('action')
    .optional({ nullable: true })
    .isString()
    .withMessage('action must be a string'),

  query('event')
    .optional({ nullable: true })
    .isString()
    .withMessage('event must be a string'),

  query('userEmail')
    .optional({ nullable: true })
    .isString()
    .withMessage('userEmail must be a string'),

  query('email')
    .optional({ nullable: true })
    .isString()
    .withMessage('email must be a string'),

  query('teamCategory')
    .optional({ nullable: true })
    .isIn(['farm_manager', 'manijero', 'collection_team', 'loading_team', 'system'])
    .withMessage('teamCategory must be one of: farm_manager, manijero, collection_team, loading_team, system'),

  query('startDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date string'),

  query('endDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('endDate must be a valid ISO8601 date string'),
];

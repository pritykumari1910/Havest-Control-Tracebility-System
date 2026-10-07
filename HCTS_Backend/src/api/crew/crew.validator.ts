import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';
import { CrewStatus } from '../../models/crew.model.ts';

const allowedStatuses = [
  ...Object.values(CrewStatus),
  ...Object.values(CrewStatus).map(s => s.toLowerCase()),
  ...Object.values(CrewStatus).map(s => s.toUpperCase())
];

export const createCrewValidator = [
  body('crewName')
    .notEmpty()
    .withMessage('crewName is required')
    .isString()
    .withMessage('crewName must be a string')
    .trim(),

  body('assignedPickers')
    .notEmpty()
    .withMessage('assignedPickers is required')
    .isArray({ min: 1 })
    .withMessage('assignedPickers must be a non-empty array')
    .custom((pickers: any[]) => {
      for (const picker of pickers) {
        if (!Types.ObjectId.isValid(picker)) {
          throw new Error('All pickers must be valid ObjectIds');
        }
      }
      return true;
    }),

  body('supervisor')
    .notEmpty()
    .withMessage('supervisor is required')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('supervisor must be a valid ObjectId');
      }
      return true;
    }),

  body('leader')
    .optional({ nullable: true })
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('leader must be a valid ObjectId');
      }
      return true;
    }),

  body('workDate')
    .optional()
    .isISO8601()
    .withMessage('workDate must be a valid ISO8601 date string'),

  body('status')
    .optional()
    .isIn(allowedStatuses)
    .withMessage(`status must be one of: ${Object.values(CrewStatus).join(', ')}`),
];

export const updateCrewValidator = [
  param('crewId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('crewId must be a valid ObjectId');
      }
      return true;
    }),

  body('crewName')
    .optional()
    .notEmpty()
    .withMessage('crewName cannot be empty')
    .isString()
    .withMessage('crewName must be a string')
    .trim(),

  body('assignedPickers')
    .optional()
    .isArray({ min: 1 })
    .withMessage('assignedPickers must be a non-empty array')
    .custom((pickers: any[]) => {
      for (const picker of pickers) {
        if (!Types.ObjectId.isValid(picker)) {
          throw new Error('All pickers must be valid ObjectIds');
        }
      }
      return true;
    }),

  body('supervisor')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('supervisor must be a valid ObjectId');
      }
      return true;
    }),

  body('leader')
    .optional({ nullable: true })
    .custom((value) => {
      if (value && !Types.ObjectId.isValid(value)) {
        throw new Error('leader must be a valid ObjectId');
      }
      return true;
    }),

  body('workDate')
    .optional()
    .isISO8601()
    .withMessage('workDate must be a valid ISO8601 date string'),

  body('status')
    .optional()
    .isIn(allowedStatuses)
    .withMessage(`status must be one of: ${Object.values(CrewStatus).join(', ')}`),
];

export const crewIdParamValidator = [
  param('crewId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('crewId must be a valid ObjectId');
      }
      return true;
    }),
];

export const supervisorIdParamValidator = [
  param('supervisorId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('supervisorId must be a valid ObjectId');
      }
      return true;
    }),
];

export const manijeroIdParamValidator = [
  param('manijeroId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('manijeroId must be a valid ObjectId');
      }
      return true;
    }),
];

export const getCrewsValidator = [
  query('campaign')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('campaign must be a valid ObjectId');
      }
      return true;
    }),

  query('supervisor')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('supervisor must be a valid ObjectId');
      }
      return true;
    }),

  query('status')
    .optional()
    .isIn(allowedStatuses)
    .withMessage(`status must be one of: ${Object.values(CrewStatus).join(', ')}`),

  query('workDate')
    .optional()
    .isISO8601()
    .withMessage('workDate must be a valid ISO8601 date string'),

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

export const getPreviousDayCrewsValidator = [
  query('supervisorId')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('supervisorId must be a valid ObjectId');
      }
      return true;
    }),
];

export const copyPreviousCrewsValidator = [
  body('crewIds')
    .optional()
    .isArray()
    .withMessage('crewIds must be an array of ObjectId strings'),
  body('crewIds.*')
    .optional()
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('Each crewId in crewIds must be a valid ObjectId');
      }
      return true;
    }),
];

export const checkInAttendanceValidator = [
  param('crewId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('crewId must be a valid ObjectId');
      }
      return true;
    }),

  body('workerIds')
    .notEmpty()
    .withMessage('workerIds is required')
    .isArray({ min: 1 })
    .withMessage('workerIds must be a non-empty array of worker IDs')
    .custom((ids: any[]) => {
      for (const id of ids) {
        if (!Types.ObjectId.isValid(id)) {
          throw new Error('All workerIds must be valid ObjectIds');
        }
      }
      return true;
    }),

  body('entryTime')
    .optional()
    .isISO8601()
    .withMessage('entryTime must be a valid ISO8601 date string'),
];

export const checkOutAttendanceValidator = [
  param('crewId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('crewId must be a valid ObjectId');
      }
      return true;
    }),

  body('workerIds')
    .notEmpty()
    .withMessage('workerIds is required')
    .isArray({ min: 1 })
    .withMessage('workerIds must be a non-empty array of worker IDs')
    .custom((ids: any[]) => {
      for (const id of ids) {
        if (!Types.ObjectId.isValid(id)) {
          throw new Error('All workerIds must be valid ObjectIds');
        }
      }
      return true;
    }),

  body('exitTime')
    .optional()
    .isISO8601()
    .withMessage('exitTime must be a valid ISO8601 date string'),
];

export const getUnassignedWorkersValidator = [
  query('workDate')
    .optional()
    .isISO8601()
    .withMessage('workDate must be a valid ISO8601 date string'),

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


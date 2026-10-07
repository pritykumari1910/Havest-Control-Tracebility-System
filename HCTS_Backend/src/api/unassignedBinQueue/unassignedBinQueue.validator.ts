import { param, body, query } from 'express-validator';
import { UnassignedBinStatus, UnassignedBinFailureReason } from '../../models/unassignedBinQueue.model.ts';

export const queueItemIdParamValidator = [
  param('queueItemId').isMongoId().withMessage('Invalid queueItemId'),
];

export const getQueueValidator = [
  query('status')
    .optional()
    .isIn(Object.values(UnassignedBinStatus))
    .withMessage(`status must be one of: ${Object.values(UnassignedBinStatus).join(', ')}`),
  query('failureReason')
    .optional()
    .isIn(Object.values(UnassignedBinFailureReason))
    .withMessage(`failureReason must be one of: ${Object.values(UnassignedBinFailureReason).join(', ')}`),
  query('campaignId').optional().isMongoId().withMessage('Invalid campaignId'),
  query('date').optional().isISO8601().withMessage('date must be a valid ISO 8601 date'),
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('limit must be between 1 and 100'),
];

export const resolveQueueItemValidator = [
  param('queueItemId').isMongoId().withMessage('Invalid queueItemId'),
  body('harvestAssignmentId').isMongoId().withMessage('harvestAssignmentId is required and must be valid'),
  body('note').optional().isString().trim().withMessage('note must be a string'),
];

export const rejectQueueItemValidator = [
  param('queueItemId').isMongoId().withMessage('Invalid queueItemId'),
  body('reason').notEmpty().isString().trim().withMessage('reason is required'),
];

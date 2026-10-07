import { body, param, query } from 'express-validator';
import { Types } from 'mongoose';
import { CampaignStatus } from '../../models/campaign.model.ts';

export const createCampaignValidator = [
  body('campaignName')
    .notEmpty()
    .withMessage('campaignName is required')
    .isString()
    .withMessage('campaignName must be a string')
    .trim(),

  body('startDate')
    .notEmpty()
    .withMessage('startDate is required')
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date string'),

  body('estimatedEndDate')
    .notEmpty()
    .withMessage('estimatedEndDate is required')
    .isISO8601()
    .withMessage('estimatedEndDate must be a valid ISO8601 date string')
    .custom((value, { req }) => {
      const start = new Date(req.body.startDate);
      const end = new Date(value);
      if (end <= start) {
        throw new Error('estimatedEndDate must be after startDate');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(Object.values(CampaignStatus))
    .withMessage(`status must be one of: ${Object.values(CampaignStatus).join(', ')}`),

  body('comments')
    .optional({ nullable: true })
    .isString()
    .withMessage('comments must be a string')
    .trim(),
];

export const updateCampaignValidator = [
  param('campaignId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('campaignId must be a valid ObjectId');
      }
      return true;
    }),

  body('campaignName')
    .optional()
    .notEmpty()
    .withMessage('campaignName cannot be empty')
    .isString()
    .withMessage('campaignName must be a string')
    .trim(),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO8601 date string'),

  body('estimatedEndDate')
    .optional()
    .isISO8601()
    .withMessage('estimatedEndDate must be a valid ISO8601 date string')
    .custom((value, { req }) => {
      if (req.body.startDate) {
        const start = new Date(req.body.startDate);
        const end = new Date(value);
        if (end <= start) {
          throw new Error('estimatedEndDate must be after startDate');
        }
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(Object.values(CampaignStatus))
    .withMessage(`status must be one of: ${Object.values(CampaignStatus).join(', ')}`),

  body('comments')
    .optional({ nullable: true })
    .isString()
    .withMessage('comments must be a string')
    .trim(),
];

export const campaignIdParamValidator = [
  param('campaignId')
    .custom((value) => {
      if (!Types.ObjectId.isValid(value)) {
        throw new Error('campaignId must be a valid ObjectId');
      }
      return true;
    }),
];

export const getCampaignsValidator = [
  query('status')
    .optional()
    .isIn(Object.values(CampaignStatus))
    .withMessage(`status must be one of: ${Object.values(CampaignStatus).join(', ')}`),
  query('campaignName')
    .optional()
    .isString()
    .withMessage('campaignName must be a string')
    .trim(),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be an integer greater than or equal to 1'),
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('limit must be an integer greater than or equal to 1'),
];

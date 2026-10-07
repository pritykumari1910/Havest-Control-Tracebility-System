import express from 'express';
import { authMiddleware, requireSystemAdminRole } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import employmentCompanyController from './employmentCompany.controller.ts';
import './employmentCompany.swagger.ts';
import {
  createCompanyValidator,
  updateCompanyValidator,
  companyIdParamValidator,
  getCompaniesValidator,
} from './employmentCompany.validator.ts';

const employmentCompanyRouter = express.Router();

employmentCompanyRouter.use(authMiddleware);

employmentCompanyRouter.post(
  '/',
  requireSystemAdminRole(),
  auditLogMiddleware({ event: 'EMPLOYMENT_COMPANY_CREATED', entityType: 'employment_company' }),
  createCompanyValidator,
  validateRequest,
  catchAsync(employmentCompanyController.createCompany)
);

employmentCompanyRouter.get(
  '/',
  getCompaniesValidator,
  validateRequest,
  catchAsync(employmentCompanyController.getCompanies)
);

employmentCompanyRouter.get(
  '/:companyId',
  companyIdParamValidator,
  validateRequest,
  catchAsync(employmentCompanyController.getCompanyById)
);

employmentCompanyRouter.patch(
  '/:companyId',
  requireSystemAdminRole(),
  auditLogMiddleware({
    event: (req) => {
      if (req.body.status !== undefined) {
        return req.body.status === 'active' ? 'EMPLOYMENT_COMPANY_ACTIVATED' : 'EMPLOYMENT_COMPANY_DEACTIVATED';
      }
      return 'EMPLOYMENT_COMPANY_UPDATED';
    },
    entityType: 'employment_company',
    getEntityId: (req) => String(req.params.companyId),
  }),
  updateCompanyValidator,
  validateRequest,
  catchAsync(employmentCompanyController.updateCompany)
);

export default employmentCompanyRouter;

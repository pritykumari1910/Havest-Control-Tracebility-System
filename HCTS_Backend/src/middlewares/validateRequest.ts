import type { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import httpStatus from 'http-status';

const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const firstErrorMsg = errors.array()[0].msg;

  return res.status(httpStatus.BAD_REQUEST).json({
    success: false,
    message: firstErrorMsg,
    responseObject: null,
    statusCode: httpStatus.BAD_REQUEST,
  });
};

export default validateRequest;

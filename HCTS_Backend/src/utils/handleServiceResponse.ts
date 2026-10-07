import type { NextFunction, Response } from 'express';
import type ServiceResponse from './ServiceResponse.ts';

const handleServiceResponse = (serviceResponse: ServiceResponse, res: Response, next?: NextFunction) => {
  res.locals.payload = serviceResponse;

  if (next) {
    return next();
  }

  return res.status(serviceResponse.statusCode).send(serviceResponse);
};

export default handleServiceResponse;

import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import config from '../config/config.ts';
import logger from '../config/logger.ts';
import ApiError from '../utils/ApiError.ts';

export const errorConverter: ErrorRequestHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose.Error ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, error.stack);
  }

  next(error);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let { statusCode, message } = err as ApiError;

  if (config.env === 'production' && !(err as ApiError).isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = err.message;

  const response = {
    success: false,
    message,
    responseObject: null,
    statusCode,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development' && statusCode >= httpStatus.INTERNAL_SERVER_ERROR) {
    logger.error(err);
  }

  if (config.env === 'development' && statusCode === httpStatus.NOT_FOUND) {
    logger.warn(message);
  }

  res.status(statusCode).send(response);
};

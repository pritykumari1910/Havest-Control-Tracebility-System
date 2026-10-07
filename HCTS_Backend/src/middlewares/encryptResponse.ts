import type { Request, Response } from 'express';
import { encryptResponsePayload } from '../utils/transport.crypto.ts';

interface PayloadWithStatus {
  statusCode?: number;
  [key: string]: unknown;
}

export const encryptResponseMiddleware = (req: Request, res: Response): Response => {
  const payload = res.locals.payload as PayloadWithStatus | undefined;

  if (!payload) {
    return res.status(500).json({
      success: false,
      message: 'Payload missing for encryption',
      responseObject: null,
      statusCode: 500,
    });
  }

  const statusCode = Number(payload.statusCode) || 200;
  const encryptedPayload = encryptResponsePayload(payload);

  return res.status(statusCode).json({
    encrypted: true,
    payload: encryptedPayload,
  });
};

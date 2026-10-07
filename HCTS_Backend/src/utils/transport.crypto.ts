import crypto from 'crypto';
import config from '../config/config.ts';

const getEncryptionKey = () => crypto.createHash('sha256').update(config.jwt.secret).digest();

export const encryptResponsePayload = (payload: unknown): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
};

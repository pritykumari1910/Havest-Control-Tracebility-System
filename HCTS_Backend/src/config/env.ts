import dotenv from 'dotenv';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 3000,
  CORS_ORIGINS: process.env.CORS_ORIGINS || '',
  MONGODB_URL: process.env.MONGODB_URL || process.env.MONGO_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_ACCESS_EXPIRATION_MINUTES: Number(process.env.JWT_ACCESS_EXPIRATION_MINUTES) || 30,
  JWT_REFRESH_EXPIRATION_DAYS: Number(process.env.JWT_REFRESH_EXPIRATION_DAYS) || 30,
  JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Number(process.env.JWT_RESET_PASSWORD_EXPIRATION_MINUTES) || 10,
  FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL || 'http://localhost:8137',
  MOBILE_BASE_URL: process.env.MOBILE_BASE_URL || 'http://localhost:8137',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || process.env.SMTP_USERNAME || '',
  SMTP_PASS: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '',
  MAIL_FROM: process.env.MAIL_FROM || process.env.EMAIL_FROM || '',
};

export default env;

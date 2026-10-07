import Joi from 'joi';
import env from './env.ts';

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    CORS_ORIGINS: Joi.string().allow('').default(''),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number().default(10),
    FRONTEND_BASE_URL: Joi.string().allow('').default('http://localhost:8137'),
    MOBILE_BASE_URL: Joi.string().allow('').default('http://localhost:8137'),
    SMTP_HOST: Joi.string().allow('').description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USER: Joi.string().allow('').description('username for email server'),
    SMTP_PASS: Joi.string().allow('').description('password for email server'),
    MAIL_FROM: Joi.string().allow('').description('the from field in the emails sent by the app'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const smtpUsername = envVars.SMTP_USER as string | undefined;
const smtpPassword = envVars.SMTP_PASS as string | undefined;
const smtpAuth = smtpUsername && smtpPassword ? { user: smtpUsername, pass: smtpPassword } : undefined;

const config = {
  env: envVars.NODE_ENV as 'production' | 'development' | 'test',
  PORT: Number(envVars.PORT),
  port: Number(envVars.PORT),
  cors: {
    origins: String(envVars.CORS_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
    options: {},
  },
  jwt: {
    secret: envVars.JWT_SECRET as string,
    accessExpirationMinutes: Number(envVars.JWT_ACCESS_EXPIRATION_MINUTES),
    refreshExpirationDays: Number(envVars.JWT_REFRESH_EXPIRATION_DAYS),
    resetPasswordExpirationMinutes: Number(envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES),
  },
  app: {
    frontendBaseUrl: String(envVars.FRONTEND_BASE_URL || 'http://localhost:8137').replace(/\/$/, ''),
    mobileBaseUrl: String(envVars.MOBILE_BASE_URL || 'http://localhost:9090').replace(/\/$/, ''),
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST as string | undefined,
      port: envVars.SMTP_PORT ? Number(envVars.SMTP_PORT) : undefined,
      ...(smtpAuth ? { auth: smtpAuth } : {}),
    },
    from: envVars.MAIL_FROM as string | undefined,
  },
};

export default config;

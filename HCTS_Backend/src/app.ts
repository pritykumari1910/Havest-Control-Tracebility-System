import compression from 'compression';
import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import httpStatus from 'http-status';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import xss from 'xss-clean';
import UserRouter from './api/auth/auth.router.ts';
import roleRouter from './api/roles/role.router.ts';
import auditRouter from './api/audit/audit.router.ts';
import campaignRouter from './api/campaign/campaign.router.ts';
import farmRouter from './api/farm/farm.router.ts';
import plotRouter from './api/plot/plot.router.ts';
import varietyRouter from './api/variety/variety.router.ts';
import valveRouter from './api/valve/valve.router.ts';
import parkRouter from './api/park/park.router.ts';
import employmentCompanyRouter from './api/employmentCompany/employmentCompany.router.ts';
import workerRouter from './api/worker/worker.router.ts';
import crewRouter from './api/crew/crew.router.ts';
import satelliteRoleRouter from './api/satelliteRole/satelliteRole.router.ts';
import machineRouter from './api/machine/machine.router.ts';
import qrSeriesRouter from './api/qrSeries/qrSeries.router.ts';
import harvestForecastRouter from './api/harvestForecast/harvestForecast.router.ts';
import logisticsRouter from './api/logistics/logistics.router.ts';
import harvestAssignmentRouter from './api/harvestAssignment/harvestAssignment.router.ts';
import satelliteStaffRouter from './api/satelliteStaff/satelliteStaff.router.ts';
import operationalStatusRouter from './api/operationalStatus/operationalStatus.router.ts';
import workerRoleChangeRouter from './api/workers/workerRoleChange.router.ts';
import receptionRouter from './api/reception/reception.router.ts';
import systemConfigRouter from './api/systemConfig/systemConfig.router.ts';
import dashboardRouter from './api/dashboard/dashboard.router.ts';
import unassignedBinQueueRouter from './api/unassignedBinQueue/unassignedBinQueue.router.ts';
import reportsRouter from './api/reports/reports.router.ts';
import config from './config/config.ts';
import { authLimiter } from './middlewares/rateLimiter.ts';
import { errorConverter, errorHandler } from './middlewares/error.ts';
import ApiError from './utils/ApiError.ts';

const app = express();

type CorsCallback = (error: Error | null, allow?: boolean) => void;
type CorsOptions = {
  origin: (origin: string | undefined, callback: CorsCallback) => void;
  credentials: boolean;
  exposedHeaders: string[];
};
   
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(xss());
app.use(mongoSanitize());
app.use(compression());

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = config.cors.origins;
    if (
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(origin) ||
      config.env === 'development'
    ) {
      return callback(null, true);
    }

    return callback(
      new Error('The CORS policy for this site does not allow access from the specified Origin.'),
      false
    );
  },
  credentials: true,
  exposedHeaders: ['set-cookie'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const swaggerSpecs = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HCTS Backend API',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    // servers: [
    //   {
    //     url: `http://localhost:${config.PORT}`,
    //   },
    // ],
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
        description: 'Local development server',
      },
      {
        url: 'https://meanstack.smartdatainc.com:8136',
        description: 'Staging server',
      },
    ],
  },
  apis: ['src/api/**/*.swagger.ts'],
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecs, {
    swaggerOptions: {
      displayRequestDuration: true,  // Shows response time per request
      persistAuthorization: true,    // JWT token remains after refresh
      deepLinking: true,             // Direct link to endpoint
      defaultModelsExpandDepth: 1,   // Models section collapsed
      defaultModelExpandDepth: 1,
      docExpansion: 'list',          // Tags list view
      tryItOutEnabled: true,         // Try it out enabled by default
    },
    customCss: `
      .swagger-ui .topbar { background-color: #1a1a2e; }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
    `,
    customSiteTitle: 'HCTS API Docs',
  })
);

if (config.env === 'production') {
  app.use('/api/user', authLimiter);
  app.use('/api/access', authLimiter);
}

app.use('/api/user', UserRouter);
app.use('/api/access', roleRouter);
app.use('/api/audit-logs', auditRouter);
app.use('/api/audit', auditRouter);
app.use('/api/campaigns', campaignRouter);
app.use('/api/farms', farmRouter);
app.use('/api/plots', plotRouter);
app.use('/api/varieties', varietyRouter);
app.use('/api/valves', valveRouter);
app.use('/api/parks', parkRouter);
app.use('/api/employment-companies', employmentCompanyRouter);
app.use('/api/workers', workerRouter);
app.use('/api/crews', crewRouter);
app.use('/api/satellite-roles', satelliteRoleRouter);
app.use('/api/machines', machineRouter);
app.use('/api/qr-series', qrSeriesRouter);
app.use('/api/harvest-forecast', harvestForecastRouter);
app.use('/api/logistics', logisticsRouter);
app.use('/api/harvest-assignments', harvestAssignmentRouter);
app.use('/api/farm-manager', harvestAssignmentRouter);
app.use('/api/satellite-staff', satelliteStaffRouter);
app.use('/api/operational-status', operationalStatusRouter);
app.use('/api/workers', workerRoleChangeRouter);
app.use('/api/reception', receptionRouter);
app.use('/api/system-parameters', systemConfigRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/unassigned-bin-queue', unassignedBinQueueRouter);
app.use('/api/reports', reportsRouter);

app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, `Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorConverter);
app.use(errorHandler);

export default app;

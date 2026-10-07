import http from 'http';
import https from 'https';
import fs from 'fs';
import mongoose from 'mongoose';
import app from './app.ts';
import env from './config/config.ts';
import satelliteRoleService from './api/satelliteRole/satelliteRole.service.ts';
import { initializeSocketServer } from './infrastructure/socket/socket.ts';

mongoose.set('strictQuery', false);

let server: http.Server | undefined;

mongoose.connect(env.mongoose.url, env.mongoose.options).then(() => {
  // seed default satellite roles
  satelliteRoleService.seedDefaultSatelliteRoles();

  // derive host:port(s) from the connection string and avoid logging credentials
  
let dbHostPort = env.mongoose.url;
  try {
    const afterSlashes = env.mongoose.url.split('//')[1] || env.mongoose.url;
    const hostPart = afterSlashes.split('/')[0];
    dbHostPort = hostPart.includes('@') ? hostPart.split('@')[1] : hostPart;
  } catch (err) {
    // fallback to full url when parsing fails
    dbHostPort = env.mongoose.url ;
  }
  console.log(`MongoDB connected ${dbHostPort}`);

  const sslKeyPath = "/home/ubuntu/ssl/privkey.pem";
  const sslCertPath = "/home/ubuntu/ssl/fullchain.pem";

  if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    console.log("Running in HTTPS mode (SSL certificates found)");

    const options = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath),
    };

    server = https.createServer(options, app).listen(env.PORT, () => {
      console.log(`Server running on https://localhost:${env.PORT}`);
      console.log(`Swagger docs available at https://localhost:${env.PORT}/api-docs`);
    });
    initializeSocketServer(server);
  } else {
    console.log("Running in HTTP mode (SSL certificates not found)");
    server = http.createServer(app).listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
      console.log(`Swagger docs available at http://localhost:${env.PORT}/api-docs`);
    });
    initializeSocketServer(server);
  }
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(1);
    });
    return;
  }

  process.exit(1);
};

const unexpectedErrorHandler = (error: unknown) => {
  console.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  if (server) {
    server.close();
  }
});

import express from "express";
import path from "path";
import { createServer } from "http";
import https from "https";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();
const port = Number(process.env.VITE_FRONTEND_PORT) || 8137;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the "dist" folder
// dotfiles: "allow" is required so /.well-known/* (Android assetlinks.json,
// Apple app-site-association) is served instead of falling through to index.html
app.use(
  express.static(path.join(__dirname, "dist"), {
    dotfiles: "allow",
    setHeaders: (res, filePath) => {
      // Digital Asset Links verifiers want exactly "application/json".
      // Express would otherwise append "; charset=utf-8".
      if (filePath.endsWith(path.join(".well-known", "assetlinks.json"))) {
        res.setHeader("Content-Type", "application/json");
      }
    },
  })
);

// Catch-all route for all paths (with a more explicit match)
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, "dist", "index.html"));
// });
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Create server (HTTP or HTTPS based on SSL availability)
let server;

const sslKeyPath = "/home/ubuntu/ssl/privkey.pem";
const sslCertPath = "/home/ubuntu/ssl/fullchain.pem";

if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
  console.log("Frontend running in HTTPS mode (SSL certificates found)");

  const options = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath),
  };

  server = https.createServer(options, app);
} else {
  console.log("Frontend running in HTTP mode (SSL certificates not found)");
  server = createServer(app);
}
//   console.log("Frontend running in HTTP mode (SSL certificates not found)");
//   server = createServer(app);
server.listen(port, (err) => {
    if (err) {
        console.log("Error:", err);
    } else {
        console.log("Express server listening on port", port);
    }
});
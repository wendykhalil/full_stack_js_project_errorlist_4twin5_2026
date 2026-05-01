const express = require('express');
const path = require('node:path');
const { corsMiddleware } = require('./config/cors');
const routes = require('./routes');
const { notFound } = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorMiddleware');
const productRoutes = require("./routes/products.routes");
const aiRoutes = require("./routes/ai.routes");
const adminRoutes = require("./routes/admin.routes");
const fraudRoutes = require("./routes/fraud.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const faceIdRoutes = require("./routes/faceId.routes");
const cameraFaceIdRoutes = require("./routes/cameraFaceId.routes");
const paymentRoutes = require('./routes/payment.routes');

// Prometheus metrics
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'bmp_backend_' });

const httpRequestsTotal = new client.Counter({
  name: 'bmp_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'bmp_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

function createApp() {
  const app = express();

  app.use(corsMiddleware());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  // Serve uploaded assets
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Prometheus metrics middleware — track every request
  app.use((req, res, next) => {
    const end = httpRequestDurationSeconds.startTimer();
    res.on('finish', () => {
      const route = req.route ? req.route.path : req.path;
      httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode });
      end({ method: req.method, route, status_code: res.statusCode });
    });
    next();
  });

  // Health check endpoint — used by K8s liveness/readiness probes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Prometheus scrape endpoint — must be before notFound middleware
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', client.register.contentType);
      res.end(await client.register.metrics());
    } catch (err) {
      res.status(500).end(err.message);
    }
  });

app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/fraud", fraudRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/faceid", faceIdRoutes);
app.use("/api/camera-faceid", cameraFaceIdRoutes);

  app.use('/api', routes);
app.use('/api/payments', paymentRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

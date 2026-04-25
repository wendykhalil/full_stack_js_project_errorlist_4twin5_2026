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

function createApp() {
  const app = express();

  app.use(corsMiddleware());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  // Serve uploaded assets
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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

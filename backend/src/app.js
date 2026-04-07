const express = require('express');
const path = require('path');
const { corsMiddleware } = require('./config/cors');
const routes = require('./routes');
const { notFound } = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorMiddleware');
const productRoutes = require("./routes/products.routes");
const aiRoutes = require("./routes/ai.routes");

function createApp() {
  const app = express();

  app.use(corsMiddleware());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  // Serve uploaded assets
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use("/api/ai", aiRoutes);

  app.use('/api', routes);


  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

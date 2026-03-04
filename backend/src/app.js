const express = require('express');
<<<<<<< HEAD
const path = require('path');
=======
>>>>>>> 647f7778898b6e789d224d02d48bccf97d15a8c9
const { corsMiddleware } = require('./config/cors');
const routes = require('./routes');
const { notFound } = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorMiddleware');

function createApp() {
  const app = express();

  app.use(corsMiddleware());
  app.use(express.json({ limit: '1mb' }));
<<<<<<< HEAD
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded assets
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
=======
>>>>>>> 647f7778898b6e789d224d02d48bccf97d15a8c9

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

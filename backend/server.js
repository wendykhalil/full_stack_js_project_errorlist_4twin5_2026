const dotenv = require('dotenv');
dotenv.config();

const http = require('node:http');
const { createApp } = require('./src/app');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/socket');
const { startExpireJob } = require('./src/jobs/expireServiceRequests');

async function bootstrap() {
  await connectDB(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const app = createApp();
  
  const server = http.createServer(app);

  // realtime (Socket.IO)
  initSocket(server, { corsOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' });

  // background jobs
  startExpireJob();

  const port = Number(process.env.PORT || 5000);
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

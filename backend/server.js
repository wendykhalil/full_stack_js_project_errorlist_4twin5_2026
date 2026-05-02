const dotenv = require('dotenv');
dotenv.config();

const http = require('node:http');
const { createApp } = require('./src/app');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/socket');
const { startExpireJob } = require('./src/jobs/expireServiceRequests');

async function bootstrap() {
  try {
    // ✅ Step 1: Connect to MongoDB first
    console.log('🔄 Connecting to MongoDB...');
    await connectDB(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');

    // ✅ Step 2: Create Express app
    const app = createApp();
    const server = http.createServer(app);

    // ✅ Step 3: Initialize Socket.IO
    initSocket(server, { corsOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' });
    console.log('✅ Socket.IO initialized');

    // ✅ Step 4: Start background jobs (AFTER MongoDB connection)
    startExpireJob();

    // ✅ Step 5: Start HTTP server
    const port = Number(process.env.PORT || 5000);
    server.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`🌐 API available at http://localhost:${port}/api`);
    });
  } catch (error) {
    console.error('❌ Bootstrap failed:', error.message);
    throw error;
  }
}

bootstrap().catch((err) => {
  console.error('❌ Fatal error during startup:', err);
  process.exit(1);
});

const dotenv = require('dotenv');
dotenv.config();

const { createApp } = require('./src/app');
const { connectDB } = require('./src/config/db');

async function bootstrap() {
  await connectDB(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const app = createApp();
  const port = Number(process.env.PORT || 5000);

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

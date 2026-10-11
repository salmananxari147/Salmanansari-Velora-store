// import 'dotenv/config';
// import cors from 'cors';
// import express from 'express';
// import { configureCloudinary } from './config/cloudinary.js';
// import { connectDB } from './config/db.js';
// import { seedIfEmpty } from './data/seed.js';
// import { errorHandler, notFound } from './middleware/error.js';
// import routes from './routes/index.js';

// const app = express();
// const origins = [process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);

// app.use(cors({ origin: origins, credentials: true }));
// app.use(express.json({ limit: '2mb' }));
// app.use('/api', routes);
// app.use(notFound);
// app.use(errorHandler);

// const port = process.env.PORT || 5000;

// await connectDB();
// configureCloudinary();
// await seedIfEmpty();

// app.listen(port, () => {
//   console.log(`VELORA API running on http://localhost:${port}`);
// });






import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { connectDB } from './config/db.js';
import { configureCloudinary } from './config/cloudinary.js';
import { seedIfEmpty } from './data/seed.js';
import { errorHandler, notFound } from './middleware/error.js';
import routes from './routes/index.js';

const app = express();

// Frontend URLs allowed to access the API
const origins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

// Middleware
app.use(cors({
  origin: origins,
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'API is running',
  });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect services and start server
const startServer = async () => {
  try {
    await connectDB();
    configureCloudinary();
    await seedIfEmpty();

    app.listen(PORT, () => {
      console.log(`VELORA API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();

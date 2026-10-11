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

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header, such as server-to-server calls.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS: Origin not allowed'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));

// Initialize database and services only once per warm serverless instance.
let initializationPromise;

function initializeApp() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await connectDB();
      configureCloudinary();
      await seedIfEmpty();

      console.log('VELORA backend initialized successfully');
    })().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'VELORA API is running',
  });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Vercel serverless entry point
export default async function handler(req, res) {
  try {
    await initializeApp();
    return app(req, res);
  } catch (error) {
    console.error('Server initialization failed:', error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: 'Server initialization failed',
      });
    }
  }
}

// Local development only
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000;

  initializeApp()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`VELORA API running at http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Server startup failed:', error);
      process.exitCode = 1;
    });
}
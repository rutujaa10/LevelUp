import dns from 'dns';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Force Google DNS to resolve MongoDB Atlas SRV records (fixes Windows SRV lookup failures)
dns.setServers(['8.8.8.8', '8.8.4.4']);

import authRoutes from './server/routes/auth.js';
import workoutRoutes from './server/routes/workouts.js';
import dietRoutes from './server/routes/diet.js';
import chatRoutes from './server/routes/chat.js';
import { seedDemoUser } from './server/seed/demoSeed.js';
import { startCoachScheduler } from './server/jobs/coachScheduler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
async function connectDB() {
  let uri = process.env.MONGODB_URI;
  
  // If no valid URI is provided (or it contains the placeholder), use an in-memory database
  if (!uri || uri.includes('<db_password>') || uri.includes('rutuja123')) {
    console.warn('\n⚠️  WARNING: No MONGODB_URI set — using in-memory database.');
    console.warn('   All data will be lost when the server restarts.');
    console.warn('   Set MONGODB_URI in .env to persist data (see README).\n');
    const mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    await seedDemoUser();
    startCoachScheduler();
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LevelUp API is running' });
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import ticketRoutes from './routes/tickets.js';
import aiRoutes from './routes/ai.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
      .split(',').map(value => value.trim());
    if (!origin || allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  }
}));
app.use(express.json({ limit: '1mb' }));
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 100 }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'DevAssist AI API' }));
app.use('/api/tickets', ticketRoutes);
app.use('/api/ai', aiRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => console.log(`DevAssist API listening on ${port}`));
  })
  .catch(error => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });

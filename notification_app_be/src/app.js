import express from 'express';
import cors from 'cors';
import { requestLoggerMiddleware, Log } from '../../logging_middleware/src/logger.js';
import notificationRoutes from './routes/notificationRoutes.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLoggerMiddleware);

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'campus-notifications',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/notifications', notificationRoutes);

app.use((req, res) => {
  Log('backend', 'warn', 'middleware', `404 — ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

app.use(errorHandler);

export default app;

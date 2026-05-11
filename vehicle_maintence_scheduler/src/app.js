import express from 'express';
import cors from 'cors';
import { requestLoggerMiddleware, Log } from '../../logging_middleware/src/logger.js';
import errorHandler from './middleware/errorHandler.js';
import healthRoute from './routes/healthRoute.js';
import scheduleRoutes from './routes/scheduleRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLoggerMiddleware);

app.use('/api/v1/health', healthRoute);
app.use('/api/v1/schedule', scheduleRoutes);

// catch-all for unknown routes
app.use((req, res) => {
  Log('backend', 'warn', 'middleware', `Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

export default app;

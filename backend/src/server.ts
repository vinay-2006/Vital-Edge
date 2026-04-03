import express, { Application } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { logger } from './services/auditLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import triageRoutes from './routes/triage.routes';
import dashboardRoutes from './routes/dashboard.routes';
import exportRoutes from './routes/export.routes';
import auditRoutes from './routes/audit.routes';

const app: Application = express();

const allowedOrigins = env.CORS_ORIGIN
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const isOriginAllowed = (origin: string): boolean => {
  return allowedOrigins.some((allowedOrigin) => {
    if (allowedOrigin.startsWith('*.')) {
      return origin.endsWith(allowedOrigin.slice(1));
    }
    return origin === allowedOrigin;
  });
};

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Vital Edge Backend',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/triage', triageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/audit-logs', auditRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info(`🚀 Vital Edge Backend running on port ${PORT}`);
  logger.info(`📊 Environment: ${env.NODE_ENV}`);
  logger.info(`🔗 CORS enabled for: ${env.CORS_ORIGIN}`);
  logger.info(`🏥 AI Triage System ready`);
});

export default app;

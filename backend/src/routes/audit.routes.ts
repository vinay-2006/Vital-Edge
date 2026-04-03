import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { auditLoggerService } from '../services/auditLogger';

const router = Router();

/**
 * GET /api/audit-logs
 * Retrieve audit logs with optional filters
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const querySchema = z.object({
      limit: z.string().transform(Number).pipe(z.number().min(1).max(1000)).optional(),
      offset: z.string().transform(Number).pipe(z.number().min(0)).optional(),
      triageId: z.string().optional(),
      action: z.enum(['TRIAGE_CREATED', 'PRIORITY_OVERRIDDEN', 'RECORD_EXPORTED']).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    });

    const params = querySchema.parse(req.query);

    const logs = await auditLoggerService.getAuditLogs({
      limit: params.limit,
      offset: params.offset,
      triageId: params.triageId,
      action: params.action,
      startDate: params.startDate,
      endDate: params.endDate,
    });

    res.json({ logs, count: logs.length });
    return;
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
      return;
    }
    console.error('Audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

export default router;

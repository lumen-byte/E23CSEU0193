import { Router } from 'express';
import { getOptimizedSchedule } from '../controllers/scheduleController.js';

const router = Router();
router.get('/', getOptimizedSchedule);

export default router;

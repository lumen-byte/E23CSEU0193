import { Router } from 'express';
import { getPriorityNotifications, getAllNotifications } from '../controllers/notificationController.js';

const router = Router();

router.get('/priority', getPriorityNotifications);
router.get('/', getAllNotifications);

export default router;

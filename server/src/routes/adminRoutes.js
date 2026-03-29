import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getDashboardStats, getAcceptedMailResponses } from '../controllers/adminController.js';

const router = Router();

// Get dashboard statistics (Admin only)
router.get('/dashboard/stats', authenticate, getDashboardStats);

// Get accepted mail responses (Admin only)
router.get('/mail/accepted-responses', authenticate, getAcceptedMailResponses);

export default router;
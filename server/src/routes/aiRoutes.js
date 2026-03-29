import { Router } from 'express';
import { generateFlyer, enhanceText, generateEmail } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/generate-flyer', authenticate, generateFlyer);
router.post('/enhance-text', authenticate, enhanceText);
router.post('/generate-email', authenticate, generateEmail);

export default router;

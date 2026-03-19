import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createOrder, verifyPayment, getMyPayments } from '../controllers/paymentController.js';

const router = Router();

router.post('/create-order', authenticate, createOrder);
router.post('/verify', authenticate, verifyPayment);
router.get('/my', authenticate, getMyPayments);

export default router;

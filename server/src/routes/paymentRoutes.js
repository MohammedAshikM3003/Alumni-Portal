import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createOrder, verifyPayment, getMyPayments, getAllPayments, getPaymentById } from '../controllers/paymentController.js';

const router = Router();

router.post('/create-order', authenticate, createOrder);
router.post('/verify', authenticate, verifyPayment);
router.get('/my', authenticate, getMyPayments);
router.get('/all', authenticate, getAllPayments);
router.get('/:id', authenticate, getPaymentById);

export default router;

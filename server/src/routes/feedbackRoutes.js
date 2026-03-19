import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { submitFeedback, getMyFeedbacks, getAllFeedbacks, getFeedbackById, getSignatureImage } from '../controllers/feedbackController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Alumni submits feedback (signature uploaded as file)
router.post('/', authenticate, upload.single('signature'), submitFeedback);

// Alumni gets their own feedbacks
router.get('/my', authenticate, getMyFeedbacks);

// Admin/Coordinator gets all feedbacks
router.get('/all', authenticate, getAllFeedbacks);

// Serve a signature image from GridFS (must be before /:id)
router.get('/image/:id', getSignatureImage);

// Get single feedback by ID
router.get('/:id', authenticate, getFeedbackById);

export default router;

import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { createInvitation, getAllInvitations, getInvitationById, getFlyerImage } from '../controllers/invitationController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Create invitation with flyer image
router.post('/', authenticate, upload.single('flyer'), createInvitation);

// Get all invitations
router.get('/all', authenticate, getAllInvitations);

// Serve flyer image from GridFS (must be before /:id)
router.get('/image/:id', getFlyerImage);

// Get single invitation by ID
router.get('/:id', authenticate, getInvitationById);

export default router;

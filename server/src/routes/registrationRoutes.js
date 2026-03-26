import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
	sendRegistrationLinks,
	sendSingleRegistrationLink,
	sendPrefilledRegistrationLink,
	validateRegistrationToken,
	submitRegistration,
} from '../controllers/registrationController.js';

const router = Router();

// Admin-only: Send registration links to emails
router.post('/send-links', authenticate, sendRegistrationLinks);

// Admin-only: Send single registration link
router.post('/send-single-link', authenticate, sendSingleRegistrationLink);

// Admin-only: Send registration link with pre-filled data
router.post('/send-prefilled-link', authenticate, sendPrefilledRegistrationLink);

// Public: Validate registration token
router.get('/validate/:token', validateRegistrationToken);

// Public: Submit registration with token
router.post('/submit/:token', submitRegistration);

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
	createAlumni,
	getAllAlumni,
	getAlumniById,
	getAlumniByRegisterNumber,
	getMyProfile,
	updateAlumni,
	updateMyProfile,
	deleteAlumni,
	searchAlumni,
} from '../controllers/alumniController.js';

const router = Router();

// Search alumni by name
router.get('/search', authenticate, searchAlumni);

// Create new alumni (creates both User and Alumni records)
router.post('/', authenticate, createAlumni);

// Get current logged-in alumni's profile
router.get('/me', authenticate, getMyProfile);

// Update current logged-in alumni's profile
router.put('/me', authenticate, updateMyProfile);

// Get all alumni (with optional filters)
router.get('/all', authenticate, getAllAlumni);

// Get alumni by register number
router.get('/register/:registerNumber', authenticate, getAlumniByRegisterNumber);

// Get single alumni by ID
router.get('/:id', authenticate, getAlumniById);

// Update alumni
router.put('/:id', authenticate, updateAlumni);

// Delete alumni
router.delete('/:id', authenticate, deleteAlumni);

export default router;

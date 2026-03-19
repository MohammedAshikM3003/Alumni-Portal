import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
	createCoordinator,
	getAllCoordinators,
	getCoordinatorById,
	updateCoordinator,
	deleteCoordinator,
	getCoordinatorsByDepartment,
} from '../controllers/coordinatorController.js';

const router = Router();

// Create new coordinator
router.post('/', authenticate, createCoordinator);

// Get all coordinators (with optional filters)
router.get('/all', authenticate, getAllCoordinators);

// Get coordinators by department
router.get('/department/:department', authenticate, getCoordinatorsByDepartment);

// Get single coordinator by ID
router.get('/:id', authenticate, getCoordinatorById);

// Update coordinator
router.put('/:id', authenticate, updateCoordinator);

// Delete coordinator
router.delete('/:id', authenticate, deleteCoordinator);

export default router;

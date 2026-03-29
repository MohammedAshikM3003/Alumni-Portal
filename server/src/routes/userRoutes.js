import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getAllUsers, getUsersByRole, getUserById, updateUser, deleteUser, searchAlumniAll, searchAlumniByEmail } from '../controllers/userController.js';

const router = Router();

// Search alumni by name, department, and batch (returns all matches)
router.get('/alumni/search-all', searchAlumniAll);

// Search alumni by email
router.get('/alumni/by-email', searchAlumniByEmail);

// Get all users (Admin only)
router.get('/', authenticate, getAllUsers);

// Get users by role (e.g., alumni, admin, coordinator)
router.get('/:role', authenticate, getUsersByRole);

// Get single user by ID
router.get('/:id', authenticate, getUserById);

// Update user
router.put('/:id', authenticate, updateUser);

// Delete user
router.delete('/:id', authenticate, deleteUser);

export default router;
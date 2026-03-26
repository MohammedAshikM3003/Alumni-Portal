import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createDepartment,
  getAllDepartments,
  getPublicDepartments,
  getDepartmentById,
  getDepartmentByCode,
  updateDepartment,
  deleteDepartment,
  updateAlumniCount
} from '../controllers/departmentController.js';

const router = Router();

// Public route - Get departments for registration form (no auth)
router.get('/public', getPublicDepartments);

// Create a new department (Admin only)
router.post('/', authenticate, createDepartment);

// Get all departments (accessible to all authenticated users)
router.get('/', authenticate, getAllDepartments);

// Get department by department code
router.get('/code/:deptCode', authenticate, getDepartmentByCode);

// Update alumni count for a department
router.patch('/:id/alumni-count', authenticate, updateAlumniCount);

// Get department by ID
router.get('/:id', authenticate, getDepartmentById);

// Update department (Admin only)
router.put('/:id', authenticate, updateDepartment);

// Delete department (Admin only)
router.delete('/:id', authenticate, deleteDepartment);

export default router;
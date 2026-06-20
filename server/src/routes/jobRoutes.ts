import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { submitJobReference, getMyJobReferences, getAllJobReferences, getDepartmentJobReferences, getJobReferenceById, deleteJobReference, updateJobReferenceStatus } from '../controllers/jobController.js';

const router = Router();

// Alumni submits job reference
router.post('/', authenticate, submitJobReference);

// Alumni gets their own job references
router.get('/my', authenticate, getMyJobReferences);

// Coordinator/Admin gets department job references
router.get('/department/all', authenticate, getDepartmentJobReferences);

// Admin/Coordinator gets all job references
router.get('/all', authenticate, getAllJobReferences);

// Get single job reference by ID
router.get('/:id', authenticate, getJobReferenceById);

// Alumni deletes their own job reference
router.delete('/:id', authenticate, deleteJobReference);

// Alumni updates their own job reference status
router.patch('/:id/status', authenticate, updateJobReferenceStatus);

export default router;

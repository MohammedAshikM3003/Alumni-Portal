import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { submitJobReference, getMyJobReferences, getAllJobReferences, getJobReferenceById, deleteJobReference } from '../controllers/jobController.js';

const router = Router();

// Alumni submits job reference
router.post('/', authenticate, submitJobReference);

// Alumni gets their own job references
router.get('/my', authenticate, getMyJobReferences);

// Admin/Coordinator gets all job references
router.get('/all', authenticate, getAllJobReferences);

// Get single job reference by ID
router.get('/:id', authenticate, getJobReferenceById);

// Alumni deletes their own job reference
router.delete('/:id', authenticate, deleteJobReference);

export default router;

import express from 'express';
import {
    saveDraft,
    updateDraft,
    getAllDrafts,
    getDraftById,
    deleteDraft,
    getDraftCount
} from '../controllers/draftController.js';

const router = express.Router();

// POST - Save a new draft
router.post('/', saveDraft);

// GET - Get draft count
router.get('/count', getDraftCount);

// GET - Get all drafts
router.get('/all', getAllDrafts);

// GET - Get a draft by ID
router.get('/:draftId', getDraftById);

// PUT - Update an existing draft
router.put('/:draftId', updateDraft);

// DELETE - Delete a draft
router.delete('/:draftId', deleteDraft);

export default router;

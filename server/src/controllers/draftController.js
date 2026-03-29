import Draft from '../models/draft.js';

/**
 * Save a draft
 * POST /api/drafts
 */
export const saveDraft = async (req, res) => {
    try {
        const {
            senderId,
            senderName,
            senderEmail,
            recipientName,
            recipientEmail,
            department,
            batch,
            recipients, // New: array of recipients
            title,
            content,
            eventName,
            eventDate,
            eventLocation,
        } = req.body;

        if (!senderId || !senderName || !senderEmail) {
            return res.status(400).json({
                success: false,
                message: 'Sender information is required'
            });
        }

        const draft = new Draft({
            senderId,
            senderName,
            senderEmail,
            // Store multiple recipients if provided
            recipients: recipients || [],
            // Legacy single recipient fields (for backward compatibility)
            recipientName: recipientName || '',
            recipientEmail: recipientEmail || '',
            department: department || '',
            batch: batch || '',
            title: title || '',
            content: content || '',
            eventName: eventName || '',
            eventDate: eventDate || '',
            eventLocation: eventLocation || '',
        });

        await draft.save();

        return res.status(201).json({
            success: true,
            message: 'Draft saved successfully',
            draft
        });

    } catch (error) {
        console.error('Error saving draft:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to save draft',
            error: error.message
        });
    }
};

/**
 * Update an existing draft
 * PUT /api/drafts/:draftId
 */
export const updateDraft = async (req, res) => {
    try {
        const { draftId } = req.params;
        const updateData = req.body;

        const draft = await Draft.findByIdAndUpdate(
            draftId,
            { ...updateData, updatedAt: new Date() },
            { new: true }
        );

        if (!draft) {
            return res.status(404).json({
                success: false,
                message: 'Draft not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Draft updated successfully',
            draft
        });

    } catch (error) {
        console.error('Error updating draft:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update draft',
            error: error.message
        });
    }
};

/**
 * Get all drafts
 * GET /api/drafts/all
 */
export const getAllDrafts = async (req, res) => {
    try {
        const drafts = await Draft.find({})
            .sort({ updatedAt: -1 })
            .select('senderId senderName recipientName recipientEmail recipients title content updatedAt');

        return res.status(200).json({
            success: true,
            drafts,
            total: drafts.length
        });

    } catch (error) {
        console.error('Error fetching drafts:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch drafts',
            error: error.message
        });
    }
};

/**
 * Get a draft by ID
 * GET /api/drafts/:draftId
 */
export const getDraftById = async (req, res) => {
    try {
        const { draftId } = req.params;

        const draft = await Draft.findById(draftId);

        if (!draft) {
            return res.status(404).json({
                success: false,
                message: 'Draft not found'
            });
        }

        return res.status(200).json({
            success: true,
            draft
        });

    } catch (error) {
        console.error('Error fetching draft:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch draft',
            error: error.message
        });
    }
};

/**
 * Delete a draft
 * DELETE /api/drafts/:draftId
 */
export const deleteDraft = async (req, res) => {
    try {
        const { draftId } = req.params;

        const draft = await Draft.findByIdAndDelete(draftId);

        if (!draft) {
            return res.status(404).json({
                success: false,
                message: 'Draft not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Draft deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting draft:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete draft',
            error: error.message
        });
    }
};

/**
 * Get draft count
 * GET /api/drafts/count
 */
export const getDraftCount = async (req, res) => {
    try {
        const count = await Draft.countDocuments({});

        return res.status(200).json({
            success: true,
            count
        });

    } catch (error) {
        console.error('Error counting drafts:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to count drafts',
            error: error.message
        });
    }
};

import express from 'express';
import multer from 'multer';
import { sendMail, getSentMails, getMailById, getDepartmentMails, getAlumniMails, getMailResponses, getMailResponsesByDepartment } from '../controllers/mailController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB file size limit
    },
    fileFilter: fileFilter
});

// POST - Send mail to alumni
router.post('/send-mail', upload.single('photo'), sendMail);

// GET - Get all sent mails for admin (both routes work)
router.get('/all', getSentMails);
router.get('/sent/:senderId', getSentMails);

// GET - Get department mails for coordinators
router.get('/department/:department', getDepartmentMails);

// GET - Get alumni mails by email
router.get('/alumni/:email', getAlumniMails);

// GET - Get all responses for a specific mail filtered by department (coordinator view)
router.get('/:mailId/responses/department/:department', getMailResponsesByDepartment);

// GET - Get all responses for a specific mail (admin view)
router.get('/:mailId/responses', getMailResponses);

// GET - Get single mail by ID
router.get('/:mailId', getMailById);

export default router;

import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEventStatus,
  updateEvent,
  deleteEvent,
  uploadEventPhoto,
  deleteEventPhoto,
} from '../controllers/eventController.js';

const router = Router();

// Configure multer for memory storage (for event images)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'image/bmp', 'image/tiff', 'image/tif', 'image/svg+xml', 'image/avif',
      'image/heic', 'image/heif', 'image/ico', 'image/x-icon'
    ];

    const isImage = file.mimetype.startsWith('image/') || allowedImageTypes.includes(file.mimetype);

    if (isImage) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Only image files are allowed.`), false);
    }
  },
});

// All routes require authentication
router.use(authenticate);

// Create event
router.post('/', createEvent);

// Get all events
router.get('/', getAllEvents);

// Get event by ID
router.get('/:id', getEventById);

// Update event status
router.patch('/:id/status', updateEventStatus);

// Update event
router.put('/:id', updateEvent);

// Delete event
router.delete('/:id', deleteEvent);

// Upload event photos (multiple)
router.post('/:id/photos', upload.array('photos', 20), uploadEventPhoto);

// Delete event photo
router.delete('/:id/photos/:photoId', deleteEventPhoto);

export default router;

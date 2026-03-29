import { Router } from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import { generateFlyer } from '../controllers/flyerController.js';
import { getGridFSBucket } from '../config/db.js';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Generate flyer from template
router.post(
  '/generate',
  authenticate,
  upload.single('template'),
  generateFlyer
);

// Get flyer image from GridFS
router.get('/image/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image ID',
      });
    }

    const bucket = getGridFSBucket();
    if (!bucket) {
      return res.status(500).json({
        success: false,
        message: 'Database storage service not initialized',
      });
    }

    const objectId = new mongoose.Types.ObjectId(id);

    // Find the file
    const files = await bucket.find({ _id: objectId }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    const file = files[0];

    // Set content type header
    res.set('Content-Type', file.contentType || 'image/png');
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Stream the file to response
    const downloadStream = bucket.openDownloadStream(objectId);

    downloadStream.on('error', (error) => {
      console.error('GridFS download error:', error);
      res.status(500).json({
        success: false,
        message: 'Error downloading image',
      });
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error getting flyer image:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default router;

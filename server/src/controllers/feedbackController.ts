import { Readable } from 'stream';
import mongoose from 'mongoose';
import type { Request, Response } from 'express';
import Feedback from '../models/feedback.js';
import { getGridFSBucket } from '../config/db.js';
import { findCoordinatorForUser } from '../utils/coordinatorResolver.js';

// Upload buffer to GridFS and return the file ID
const uploadToGridFS = (buffer: Buffer, filename: string, mimetype: string): Promise<mongoose.Types.ObjectId> => {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket();
    if (!bucket) {
      return reject(new Error('GridFSBucket not initialized'));
    }
    const readStream = Readable.from(buffer);
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { contentType: mimetype },
    });

    readStream.pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => resolve(uploadStream.id));
  });
};

export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      reviewedBy,
      date,
      time,
      visionIV,
      missionIM,
      visionDV,
      missionDM,
      peos,
    } = req.body;

    // Parse JSON strings from FormData
    const parsedSections = {
      visionIV: JSON.parse(visionIV),
      missionIM: JSON.parse(missionIM),
      visionDV: JSON.parse(visionDV),
      missionDM: JSON.parse(missionDM),
      peos: JSON.parse(peos),
    };

    if (!reviewedBy || !date || !time || !req.file) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Upload signature image to GridFS
    const signatureId = await uploadToGridFS(
      req.file.buffer,
      `signature_${req.user._id}_${Date.now()}`,
      req.file.mimetype
    );

    const feedback = await Feedback.create({
      submittedBy: req.user._id,
      reviewedBy,
      date,
      time,
      ...parsedSections,
      signature: signatureId,
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMyFeedbacks = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const feedbacks = await Feedback.find({ submittedBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, feedbacks });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAllFeedbacks = async (req: Request, res: Response): Promise<void> => {
  try {
    const feedbacks = await Feedback.find()
      .populate<{ submittedBy: { email: string; name: string; userId: string } }>('submittedBy', 'name email userId')
      .sort({ createdAt: -1 });

    const { default: Alumni } = await import('../models/alumni.js');

    // Bulk fetch alumni branches by email
    const emails = Array.from(
      new Set(feedbacks.map(f => f.submittedBy?.email?.toLowerCase()).filter(Boolean))
    );

    const alumniList = await Alumni.find({ email: { $in: emails } }).select('email branch');
    const alumniBranchMap = new Map<string, string>();
    for (const alumni of alumniList) {
      if (alumni.email && alumni.branch) {
        alumniBranchMap.set(alumni.email.toLowerCase(), alumni.branch);
      }
    }

    const feedbacksWithBranch = feedbacks.map(fb => {
      const fbObj = fb.toObject() as any;
      const userEmail = fb.submittedBy?.email?.toLowerCase();
      fbObj.department = userEmail ? (alumniBranchMap.get(userEmail) || '') : '';
      return fbObj;
    });

    res.status(200).json({ success: true, feedbacks: feedbacksWithBranch });
  } catch (error) {
    console.error('Error fetching all feedbacks:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getFeedbackById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid feedback ID' });
      return;
    }

    const feedback = await Feedback.findById(id)
      .populate('submittedBy', 'name email userId');

    if (!feedback) {
      res.status(404).json({ success: false, message: 'Feedback not found' });
      return;
    }

    res.status(200).json({ success: true, feedback });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getSignatureImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid image ID' });
      return;
    }

    const bucket = getGridFSBucket();
    if (!bucket) {
      res.status(500).json({ success: false, message: 'GridFSBucket not initialized' });
      return;
    }

    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(id) }).toArray();

    if (!files.length) {
      res.status(404).json({ success: false, message: 'Image not found' });
      return;
    }

    res.set('Content-Type', (files[0] as any).contentType || files[0].metadata?.contentType || 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(id as string));
    downloadStream.pipe(res);
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getDepartmentFeedbacks = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get coordinator's department
    if (req.user?.role !== 'coordinator') {
      await getAllFeedbacks(req, res);
      return;
    }

    const coordinator = await findCoordinatorForUser(req.user);
    const department = coordinator?.department || '';

    if (!department) {
      res.status(400).json({
        success: false,
        message: 'Coordinator department not found',
      });
      return;
    }

    // Normalize department name for case-insensitive comparison
    const normalizedDepartment = department.trim().toLowerCase();

    const feedbacks = await Feedback.find()
      .populate<{ submittedBy: { email: string } }>('submittedBy', 'name email userId')
      .sort({ createdAt: -1 });

    // Import Alumni model to check branch
    const { default: Alumni } = await import('../models/alumni.js');

    // Filter by coordinator's department
    const departmentFeedbacks = [];
    for (const feedback of feedbacks) {
      try {
        const alumni = await Alumni.findOne({
          email: feedback.submittedBy?.email?.toLowerCase(),
        }).select('branch');

        const normalizedBranch = (alumni?.branch || '').trim().toLowerCase();
        if (normalizedBranch === normalizedDepartment) {
          departmentFeedbacks.push(feedback);
        }
      } catch (err) {
        console.error('Error checking alumni for feedback:', err);
      }
    }

    res.status(200).json({
      success: true,
      feedbacks: departmentFeedbacks,
      total: departmentFeedbacks.length,
      department,
    });
  } catch (error) {
    console.error('Error fetching department feedbacks:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

import mongoose from 'mongoose';
import type { Request, Response } from 'express';
import { getGridFSBucket } from '../config/db.js';
import Flyer from '../models/flyer.js';

interface RequestBody {
  eventName?: string;
  subtitle?: string;
  eventDescription?: string;
  eventDate?: string;
  date?: string;
  venue?: string;
  guestName?: string;
  theme?: string;
  hostedBy?: string;
  templateName?: string;
  logoUrl?: string;
  logo?: string;
  guestPhotoUrl?: string;
  guestImage?: string;
  backgroundUrl?: string;
  banner?: string;
  background?: string;
}

const normalizeRequestData = (body: RequestBody = {}) => {
  return {
    eventName: String(body.eventName || '').trim(),
    subtitle: String(body.subtitle || body.eventDescription || '').trim(),
    eventDate: String(body.eventDate || body.date || '').trim(),
    venue: String(body.venue || '').trim(),
    guestName: String(body.guestName || '').trim(),
    theme: String(body.theme || body.hostedBy || '').trim(),
    templateName: String(body.templateName || 'modern_event').trim(),
    logoUrl: String(body.logoUrl || body.logo || '').trim(),
    guestPhotoUrl: String(body.guestPhotoUrl || body.guestImage || '').trim(),
    backgroundUrl: String(body.backgroundUrl || body.banner || body.background || '').trim(),
  };
};

const extractFileSummary = (files: any = {}) => ({
  guestPhoto: Boolean(files.guestPhoto?.[0]),
  logo: Boolean(files.logo?.[0]),
  background: Boolean(files.background?.[0] || files.banner?.[0] || files.template?.[0]),
});

export const generateFlyer = async (req: Request, res: Response): Promise<void> => {
  try {
    const flyerData = normalizeRequestData(req.body);
    const fileSummary = extractFileSummary(req.files || {});

    if (!flyerData.eventName) {
      res.status(400).json({ success: false, message: 'Event name is required' });
      return;
    }

    if (!flyerData.eventDate) {
      res.status(400).json({ success: false, message: 'Event date is required' });
      return;
    }

    if (!flyerData.venue) {
      res.status(400).json({ success: false, message: 'Venue is required' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const flyer = new Flyer({
      eventName: flyerData.eventName,
      guestName: flyerData.guestName,
      guestImage: flyerData.guestPhotoUrl || '',
      date: flyerData.eventDate,
      venue: flyerData.venue,
      hostedBy: flyerData.theme,
      tagline: flyerData.subtitle,
      eventDescription: flyerData.subtitle,
      templateImageId: 'placeholder_template_id',
      generatedImageId: 'placeholder_generated_id',
      geminiPrompt: `placeholder:${flyerData.templateName}`,
      createdBy: req.user._id,
    });

    const savedFlyer = await flyer.save();

    res.status(202).json({
      success: true,
      message: 'AI will be Integrated soon',
      data: {
        flyerId: savedFlyer._id.toString(),
        templateName: flyerData.templateName,
        receivedAt: new Date().toISOString(),
        receivedDetails: {
          eventName: flyerData.eventName,
          subtitle: flyerData.subtitle,
          eventDate: flyerData.eventDate,
          venue: flyerData.venue,
          guestName: flyerData.guestName,
          theme: flyerData.theme,
          hasGuestPhoto: fileSummary.guestPhoto || Boolean(flyerData.guestPhotoUrl),
          hasLogo: fileSummary.logo || Boolean(flyerData.logoUrl),
          hasBackground: fileSummary.background || Boolean(flyerData.backgroundUrl),
        },
      },
    });
  } catch (error: any) {
    console.error('[Flyer] Placeholder flow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to receive flyer details',
      error: error.message || 'Unknown error',
    });
  }
};

export const getFlyerImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: fileId } = req.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid file ID format',
      });
      return;
    }

    const bucket = getGridFSBucket();
    if (!bucket) {
      res.status(500).json({
        success: false,
        message: 'Database storage service not initialized',
      });
      return;
    }

    const objectId = new mongoose.Types.ObjectId(fileId as string);
    const files = await bucket.find({ _id: objectId }).toArray();

    if (!files.length) {
      res.status(404).json({
        success: false,
        message: 'Flyer image not found',
      });
      return;
    }

    const file = files[0];
    res.set('Content-Type', (file as any).contentType || file.metadata?.contentType || 'image/png');
    res.set('Cache-Control', 'public, max-age=31536000');
    res.set('Content-Disposition', `inline; filename="${file.filename}"`);

    const downloadStream = bucket.openDownloadStream(objectId);
    downloadStream.on('error', (error) => {
      console.error('[GridFS] Download stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming image',
        });
      }
    });

    downloadStream.pipe(res);
  } catch (error: any) {
    console.error('[Flyer] Get image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve flyer image',
      error: error.message,
    });
  }
};

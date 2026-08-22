import Event from '../models/event.js';
import Department from '../models/department.js';
import mongoose from 'mongoose';
import type { Request, Response } from 'express';
import { getGridFSBucket } from '../config/db.js';
import { findCoordinatorForUser } from '../utils/coordinatorResolver.js';
import { formatBranchName } from '../utils/formatBranch.js';

// Helper to get coordinator department document
const getCoordinatorDepartmentDoc = async (user: any) => {
  const coordinator = await findCoordinatorForUser(user);
  if (!coordinator || !coordinator.department) return null;
  return await Department.findOne({
    $or: [
      { branch: coordinator.department },
      { deptCode: coordinator.department },
      { branch: formatBranchName(coordinator.department) }
    ]
  });
};

// Create a new event
export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventName, eventDate, eventDay, eventTime, venue, organizer, coOrganizers, batch } = req.body;

    // Validation
    if (!eventName || !eventDate || !eventDay || !eventTime || !venue || !organizer) {
      res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    let finalOrganizer = organizer;
    if (req.user.role === 'coordinator') {
      const coordDept = await getCoordinatorDepartmentDoc(req.user);
      if (!coordDept) {
        res.status(403).json({ success: false, message: 'Coordinator department not found or access denied' });
        return;
      }
      finalOrganizer = coordDept._id;
    }

    const event = await Event.create({
      eventName,
      eventDate,
      eventDay,
      eventTime,
      venue,
      batch: batch || undefined,
      organizer: finalOrganizer,
      coOrganizers: coOrganizers || [],
      status: 'upcoming',
      createdBy: req.user._id,
    });

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'branch deptCode')
      .populate('coOrganizers', 'branch deptCode')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: populatedEvent,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Helper to automatically change past upcoming events to completed status
export const autoCompletePastEvents = async (): Promise<void> => {
  try {
    const now = new Date();
    const upcomingEvents = await Event.find({ status: { $in: ['upcoming', 'pending'] } });
    const eventsToComplete = upcomingEvents.filter(e => {
      const eventDate = new Date(e.eventDate);
      if (e.eventTime) {
        const [hours, minutes] = e.eventTime.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          eventDate.setHours(hours, minutes, 0, 0);
        }
      } else {
        eventDate.setHours(23, 59, 59, 999);
      }
      return eventDate < now;
    });

    if (eventsToComplete.length > 0) {
      const idsToUpdate = eventsToComplete.map(e => e._id);
      await Event.updateMany(
        { _id: { $in: idsToUpdate } },
        { $set: { status: 'completed' } }
      );
      console.log(`[Auto-Complete] Transitioned ${eventsToComplete.length} events to completed status.`);
    }
  } catch (error) {
    console.error('Error in autoCompletePastEvents helper:', error);
  }
};

// Get all events
export const getAllEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    await autoCompletePastEvents();
    const events = await Event.find()
      .populate('organizer', 'name branch deptCode')
      .populate('coOrganizers', 'branch deptCode')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Get event by ID
export const getEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    await autoCompletePastEvents();
    const { id } = req.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid event ID' });
      return;
    }

    const event = await Event.findById(id)
      .populate('organizer', 'branch deptCode')
      .populate('coOrganizers', 'branch deptCode')
      .populate('createdBy', 'name email');

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Update event status
export const updateEventStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['upcoming', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status. Must be upcoming, completed, or cancelled',
      });
      return;
    }

    if (req.user?.role === 'coordinator') {
      const coordDept = await getCoordinatorDepartmentDoc(req.user);
      if (!coordDept) {
        res.status(403).json({ success: false, message: 'Coordinator department not found' });
        return;
      }
      const existing = await Event.findById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Event not found' });
        return;
      }
      if (existing.organizer.toString() !== coordDept._id.toString()) {
        res.status(403).json({ success: false, message: 'Access denied: You can only update events organized by your department' });
        return;
      }
    }

    const event = await Event.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: 'after' }
    )
      .populate('organizer', 'branch deptCode')
      .populate('coOrganizers', 'branch deptCode');

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Event status updated successfully',
      event,
    });
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Update event
export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.user?.role === 'coordinator') {
      const coordDept = await getCoordinatorDepartmentDoc(req.user);
      if (!coordDept) {
        res.status(403).json({ success: false, message: 'Coordinator department not found' });
        return;
      }
      const existing = await Event.findById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Event not found' });
        return;
      }
      if (existing.organizer.toString() !== coordDept._id.toString()) {
        res.status(403).json({ success: false, message: 'Access denied: You can only edit events organized by your department' });
        return;
      }
      updateData.organizer = coordDept._id;
    }

    const event = await Event.findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
      .populate('organizer', 'branch deptCode')
      .populate('coOrganizers', 'branch deptCode');

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Delete event
export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user?.role === 'coordinator') {
      const coordDept = await getCoordinatorDepartmentDoc(req.user);
      if (!coordDept) {
        res.status(403).json({ success: false, message: 'Coordinator department not found' });
        return;
      }
      const existing = await Event.findById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: 'Event not found' });
        return;
      }
      if (existing.organizer.toString() !== coordDept._id.toString()) {
        res.status(403).json({ success: false, message: 'Access denied: You can only delete events organized by your department' });
        return;
      }
    }

    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
      });
      return;
    }

    // Also delete associated photos from GridFS
    if (event.photos && event.photos.length > 0) {
      const bucket = getGridFSBucket();
      if (bucket) {
        for (const photoId of event.photos) {
          try {
            await bucket.delete(new mongoose.Types.ObjectId(photoId));
          } catch (err) {
            console.error('Error deleting photo:', err);
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Upload event photos (only for completed events)
export const uploadEventPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No files provided',
      });
      return;
    }

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
      });
      return;
    }

    if (req.user?.role === 'coordinator') {
      const coordDept = await getCoordinatorDepartmentDoc(req.user);
      if (!coordDept) {
        res.status(403).json({ success: false, message: 'Coordinator department not found' });
        return;
      }
      const isAuthorized = event.organizer.toString() === coordDept._id.toString() ||
        event.coOrganizers.some((c: any) => c.toString() === coordDept._id.toString());
      if (!isAuthorized) {
        res.status(403).json({ success: false, message: 'Access denied: You can only upload photos for events involving your department' });
        return;
      }
    }

    if (event.status !== 'completed') {
      res.status(400).json({
        success: false,
        message: 'Photos can only be added to completed events',
      });
      return;
    }

    const bucket = getGridFSBucket();
    if (!bucket) {
      res.status(500).json({
        success: false,
        message: 'GridFS not initialized',
      });
      return;
    }

    const uploadedIds: string[] = [];

    // Upload all files
    const uploadPromises = files.map((file) => {
      return new Promise<void>((resolve, reject) => {
        const filename = `event_${id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const uploadStream = bucket.openUploadStream(filename, {
          metadata: {
            contentType: file.mimetype,
            eventId: id,
            type: 'eventPhoto',
            originalName: file.originalname,
          },
        });

        uploadStream.end(file.buffer);

        uploadStream.on('finish', () => {
          uploadedIds.push(uploadStream.id.toString());
          resolve();
        });

        uploadStream.on('error', (error) => {
          console.error('GridFS upload error:', error);
          reject(error);
        });
      });
    });

    await Promise.all(uploadPromises);

    // Add all photo IDs to event
    event.photos.push(...uploadedIds);
    await event.save();

    res.status(201).json({
      success: true,
      message: `${uploadedIds.length} image(s) uploaded successfully`,
      photoIds: uploadedIds,
    });
  } catch (error) {
    console.error('Error uploading event photos:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Delete event photo
export const deleteEventPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, photoId } = req.params as { id: string, photoId: string };

    if (!mongoose.Types.ObjectId.isValid(photoId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid photo ID',
      });
      return;
    }

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found',
      });
      return;
    }

    if (req.user?.role === 'coordinator') {
      const coordDept = await getCoordinatorDepartmentDoc(req.user);
      if (!coordDept) {
        res.status(403).json({ success: false, message: 'Coordinator department not found' });
        return;
      }
      const isAuthorized = event.organizer.toString() === coordDept._id.toString() ||
        event.coOrganizers.some((c: any) => c.toString() === coordDept._id.toString());
      if (!isAuthorized) {
        res.status(403).json({ success: false, message: 'Access denied: You can only delete photos for events involving your department' });
        return;
      }
    }

    if (!event.photos.includes(photoId)) {
      res.status(404).json({
        success: false,
        message: 'Photo not found in this event',
      });
      return;
    }

    const bucket = getGridFSBucket();
    if (!bucket) {
      res.status(500).json({
        success: false,
        message: 'GridFS not initialized',
      });
      return;
    }

    await bucket.delete(new mongoose.Types.ObjectId(photoId as string));

    event.photos = event.photos.filter((p: string) => p !== photoId);
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting event photo:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

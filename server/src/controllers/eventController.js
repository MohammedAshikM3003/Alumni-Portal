import Event from '../models/event.js';
import mongoose from 'mongoose';
import { getGridFSBucket } from '../config/db.js';

// Create a new event
export const createEvent = async (req, res) => {
  try {
    const { eventName, eventDate, eventDay, eventTime, venue, organizer, coOrganizers } = req.body;

    // Validation
    if (!eventName || !eventDate || !eventDay || !eventTime || !venue || !organizer) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
      });
    }

    const event = await Event.create({
      eventName,
      eventDate,
      eventDay,
      eventTime,
      venue,
      organizer,
      coOrganizers: coOrganizers || [],
      status: 'pending',
      createdBy: req.user.id,
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

// Get all events
export const getAllEvents = async (req, res) => {
  try {
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
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id)
      .populate('organizer', 'branch deptCode')
      .populate('coOrganizers', 'branch deptCode')
      .populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
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
export const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, completed, or cancelled',
      });
    }

    const event = await Event.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate('organizer', 'branch deptCode')
      .populate('coOrganizers', 'branch deptCode');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
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
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const event = await Event.findByIdAndUpdate(id, updateData, { new: true })
      .populate('organizer', 'branch deptCode')
      .populate('coOrganizers', 'branch deptCode');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
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
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
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
export const uploadEventPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided',
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    if (event.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Photos can only be added to completed events',
      });
    }

    const bucket = getGridFSBucket();
    if (!bucket) {
      return res.status(500).json({
        success: false,
        message: 'GridFS not initialized',
      });
    }

    const uploadedIds = [];

    // Upload all files
    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const filename = `event_${id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const uploadStream = bucket.openUploadStream(filename, {
          contentType: file.mimetype,
          metadata: {
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
export const deleteEventPhoto = async (req, res) => {
  try {
    const { id, photoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(photoId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photo ID',
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    if (!event.photos.includes(photoId)) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found in this event',
      });
    }

    const bucket = getGridFSBucket();
    if (!bucket) {
      return res.status(500).json({
        success: false,
        message: 'GridFS not initialized',
      });
    }

    await bucket.delete(new mongoose.Types.ObjectId(photoId));

    event.photos = event.photos.filter(p => p !== photoId);
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

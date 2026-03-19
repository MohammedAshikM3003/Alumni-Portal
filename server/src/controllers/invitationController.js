import { Readable } from 'stream';
import mongoose from 'mongoose';
import Invitation from '../models/invitation.js';
import { getGridFSBucket } from '../config/db.js';

// Upload buffer to GridFS and return the file ID
const uploadToGridFS = (buffer, filename, mimetype) => {
	return new Promise((resolve, reject) => {
		const bucket = getGridFSBucket();
		const readStream = Readable.from(buffer);
		const uploadStream = bucket.openUploadStream(filename, {
			contentType: mimetype,
		});

		readStream.pipe(uploadStream)
			.on('error', reject)
			.on('finish', () => resolve(uploadStream.id));
	});
};

export const createInvitation = async (req, res) => {
	try {
		const {
			sender,
			subject,
			eventDate,
			eventTime,
			venue,
			description,
		} = req.body;

		if (!sender || !subject || !eventDate || !eventTime || !venue || !description) {
			return res.status(400).json({ success: false, message: 'All fields are required' });
		}

		let flyerId = null;
		if (req.file) {
			flyerId = await uploadToGridFS(
				req.file.buffer,
				`flyer_${req.user._id}_${Date.now()}`,
				req.file.mimetype
			);
		}

		const invitation = await Invitation.create({
			createdBy: req.user._id,
			sender,
			subject,
			eventDate,
			eventTime,
			venue,
			description,
			flyer: flyerId,
		});

		res.status(201).json({
			success: true,
			message: 'Invitation created successfully',
			invitation,
		});
	} catch (error) {
		if (error.name === 'ValidationError') {
			return res.status(400).json({ success: false, message: error.message });
		}
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

export const getAllInvitations = async (req, res) => {
	try {
		const invitations = await Invitation.find()
			.populate('createdBy', 'name email userId')
			.sort({ createdAt: -1 });
		res.status(200).json({ success: true, invitations });
	} catch {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

export const getInvitationById = async (req, res) => {
	try {
		const { id } = req.params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ success: false, message: 'Invalid invitation ID' });
		}

		const invitation = await Invitation.findById(id)
			.populate('createdBy', 'name email userId');

		if (!invitation) {
			return res.status(404).json({ success: false, message: 'Invitation not found' });
		}

		res.status(200).json({ success: true, invitation });
	} catch {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

export const getFlyerImage = async (req, res) => {
	try {
		const { id } = req.params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ success: false, message: 'Invalid image ID' });
		}

		const bucket = getGridFSBucket();
		const files = await bucket.find({ _id: new mongoose.Types.ObjectId(id) }).toArray();

		if (!files.length) {
			return res.status(404).json({ success: false, message: 'Image not found' });
		}

		res.set('Content-Type', files[0].contentType);
		res.set('Cache-Control', 'public, max-age=86400');
		const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(id));
		downloadStream.pipe(res);
	} catch {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

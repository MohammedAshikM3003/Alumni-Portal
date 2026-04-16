import mongoose from 'mongoose';
import { getGridFSBucket } from '../config/db.js';

/**
 * Upload an image to GridFS
 */
export const uploadImage = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({
				success: false,
				message: 'No image file provided',
			});
		}

		const bucket = getGridFSBucket();
		if (!bucket) {
			return res.status(500).json({
				success: false,
				message: 'GridFS not initialized',
			});
		}

		const { type } = req.body;
		const filename = `${type || 'image'}_${req.user._id}_${Date.now()}`;

		// Determine content type - use mimetype if available, otherwise fallback
		const contentType = req.file.mimetype || 'image/png';

		const uploadStream = bucket.openUploadStream(filename, {
			contentType: contentType,
			metadata: {
				userId: req.user._id,
				type: type || 'image',
				originalName: req.file.originalname,
				mimeType: contentType,  // Store as backup in metadata
			},
		});

		// Properly write buffer to stream
		uploadStream.write(req.file.buffer);
		uploadStream.end();

		let responseSent = false;

		uploadStream.on('finish', () => {
			if (!responseSent) {
				responseSent = true;
				res.status(201).json({
					success: true,
					message: 'Image uploaded successfully',
					imageId: uploadStream.id.toString(),
					filename: filename,
				});
			}
		});

		uploadStream.on('error', (error) => {
			if (!responseSent) {
				responseSent = true;
				console.error('[ImageController] uploadImage - Stream error:', error);
				res.status(500).json({
					success: false,
					message: 'Error uploading image',
				});
			}
		});
	} catch (error) {
		console.error('Error uploading image:', error);
		res.status(500).json({
			success: false,
			message: 'Server error',
		});
	}
};

/**
 * Get an image from GridFS by ID
 */
export const getImage = async (req, res) => {
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
				message: 'GridFS not initialized',
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

		// Set content type header - check file.contentType, metadata.mimeType, or fallback
		const responseContentType = file.contentType || file.metadata?.mimeType || 'image/png';
		res.set('Content-Type', responseContentType);
		res.set('Cache-Control', 'public, max-age=31536000');

		// Set original file name if available in metadata
		if (file.metadata && file.metadata.originalName) {
			res.set('X-File-Name', file.metadata.originalName);
		}

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
		console.error('Error getting image:', error);
		res.status(500).json({
			success: false,
			message: 'Server error',
		});
	}
};

/**
 * Delete an image from GridFS by ID
 */
export const deleteImage = async (req, res) => {
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
				message: 'GridFS not initialized',
			});
		}

		const objectId = new mongoose.Types.ObjectId(id);

		// Check if file exists and belongs to user
		const files = await bucket.find({ _id: objectId }).toArray();

		if (!files || files.length === 0) {
			return res.status(404).json({
				success: false,
				message: 'Image not found',
			});
		}

		const file = files[0];

		// Check ownership (optional - admins can delete any)
		if (
			req.user.role !== 'admin' &&
			file.metadata?.userId?.toString() !== req.user._id.toString()
		) {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to delete this image',
			});
		}

		await bucket.delete(objectId);

		res.status(200).json({
			success: true,
			message: 'Image deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting image:', error);
		res.status(500).json({
			success: false,
			message: 'Server error',
		});
	}
};

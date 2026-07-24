import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import User from '../models/user.js';
import Alumni from '../models/alumni.js';

/**
 * Format DOB to password string (DDMMYYYY)
 * @param {Date|string} dob - Date of birth
 * @returns {string} Password in DDMMYYYY format
 */
const formatDobAsPassword = (dob: Date | string): string => {
	const date = new Date(dob);
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();
	return `${day}${month}${year}`;
};

// Create a new alumni (creates both User and Alumni records)
export const createAlumni = async (req: Request, res: Response): Promise<void> => {
	try {
		const {
			// Required fields
			registerNumber,
			name,
			email,
			dob,
			yearFrom,
			yearTo,
			degree,
			branch,

			// Optional fields
			fatherName,
			presentAddress,
			permanentAddress,
			hasCompetitiveExams,
			competitiveExams,
			collegeQualifications,
			placementType,
			designation,
			companyAddress,
			employmentRemarks,
			isEntrepreneur,
			entrepreneurDetails,
			maritalStatus,
			spouseDetails,
			extraCurricular,
			otherInfo,
			knownAlumni,
			signature,
		} = req.body;

		// Validate required fields
		if (!registerNumber || !name || !email || !dob || !yearFrom || !yearTo || !degree || !branch) {
			res.status(400).json({
				success: false,
				message: 'Required fields are missing (registerNumber, name, email, dob, yearFrom, yearTo, degree, branch)',
			});
			return;
		}

		// Check if user with email or registerNumber already exists
		const existingUser = await User.findOne({
			$or: [{ email }, { userId: registerNumber }],
		});
		if (existingUser) {
			res.status(400).json({
				success: false,
				message: 'User with this email or register number already exists',
			});
			return;
		}

		// Check if alumni with registerNumber already exists
		const existingAlumni = await Alumni.findOne({ registerNumber });
		if (existingAlumni) {
			res.status(400).json({
				success: false,
				message: 'Alumni with this register number already exists',
			});
			return;
		}

		// Generate password from DOB (DDMMYYYY format)
		const password = formatDobAsPassword(dob);

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Create User account for authentication
		const newUser = await User.create({
			userId: registerNumber,
			name,
			email,
			password: hashedPassword,
			role: 'alumni',
		});

		// Create Alumni record with detailed information
		const alumni = await Alumni.create({
			userId: newUser._id,
			registerNumber,
			name,
			fatherName,
			email,
			dob: new Date(dob),
			yearFrom,
			yearTo,
			degree,
			branch,
			presentAddress,
			permanentAddress,
			hasCompetitiveExams,
			competitiveExams,
			collegeQualifications,
			placementType,
			designation,
			companyAddress,
			employmentRemarks,
			isEntrepreneur,
			entrepreneurDetails,
			maritalStatus,
			spouseDetails,
			extraCurricular,
			otherInfo,
			knownAlumni,
			signature,
		});

		// Populate the alumni with user details for response
		const populatedAlumni = await Alumni.findById(alumni._id).populate(
			'userId',
			'userId name email role'
		);

		res.status(201).json({
			success: true,
			message: 'Alumni created successfully',
			alumni: populatedAlumni,
		});
	} catch (error: any) {
		if (error.name === 'ValidationError') {
			res.status(400).json({
				success: false,
				message: error.message,
			});
			return;
		}
		console.error('Error creating alumni:', error);
		res.status(500).json({
			success: false,
			message: 'Server error',
		});
	}
};

// Get all alumni
export const getAllAlumni = async (req: Request, res: Response): Promise<void> => {
	try {
		const { branch, degree, yearFrom, yearTo } = req.query as { branch?: string; degree?: string; yearFrom?: string; yearTo?: string };
		const filter: Record<string, any> = {};

		if (branch) filter.branch = branch;
		if (degree) filter.degree = degree;
		if (yearFrom) filter.yearFrom = parseInt(yearFrom, 10);
		if (yearTo) filter.yearTo = parseInt(yearTo, 10);

		const alumni = await Alumni.find(filter)
			.populate('userId', 'userId name email role')
			.sort({ name: 1 });

		res.status(200).json({ success: true, alumni });
	} catch {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

// Get current logged-in alumni's profile
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user) {
			res.status(401).json({ success: false, message: 'Unauthorized' });
			return;
		}

		const alumni = await Alumni.findOne({ userId: req.user._id }).populate(
			'userId',
			'userId name email role'
		);

		if (!alumni) {
			res.status(404).json({
				success: false,
				message: 'Alumni profile not found. Please create your alumni profile first.'
			});
			return;
		}

		res.status(200).json({ success: true, alumni });
	} catch (error) {
		console.error('Error fetching profile:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

// Get alumni by ID (supports searching by either Alumni ID or User ID reference)
export const getAlumniById = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params as { id: string };
		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ success: false, message: 'Invalid ID' });
			return;
		}

		const objectId = new mongoose.Types.ObjectId(id);
		const alumni = await Alumni.findOne({
			$or: [
				{ _id: objectId },
				{ userId: objectId }
			]
		}).populate(
			'userId',
			'userId name email role'
		);

		if (!alumni) {
			res.status(404).json({ success: false, message: 'Alumni not found' });
			return;
		}

		res.status(200).json({ success: true, alumni });
	} catch (error) {
		console.error('Error fetching alumni by ID:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

// Get alumni by register number
export const getAlumniByRegisterNumber = async (req: Request, res: Response): Promise<void> => {
	try {
		const { registerNumber } = req.params;

		const alumni = await Alumni.findOne({ registerNumber }).populate(
			'userId',
			'userId name email role'
		);

		if (!alumni) {
			res.status(404).json({ success: false, message: 'Alumni not found' });
			return;
		}

		res.status(200).json({ success: true, alumni });
	} catch {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

// Update current logged-in alumni's profile
export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user) {
			res.status(401).json({ success: false, message: 'Unauthorized' });
			return;
		}

		// Find alumni by logged-in user's ID
		let alumni = await Alumni.findOne({ userId: req.user._id });

		// If alumni record doesn't exist, create one
		if (!alumni) {
			const user = await User.findById(req.user._id);
			if (!user) {
				res.status(401).json({
					success: false,
					message: 'User not found'
				});
				return;
			}

			// Create a new Alumni record with default values
			alumni = new Alumni({
				userId: req.user._id,
				name: user.name,
				email: user.email,
				registerNumber: user.userId || `TEMP_${Date.now()}`,
				dob: new Date(),
				yearFrom: new Date().getFullYear() - 4,
				yearTo: new Date().getFullYear(),
				degree: '',
				branch: ''
			});
			await alumni.save();
		}

		// Fields that alumni can update themselves
		const allowedUpdates = [
			'presentAddress',
			'permanentAddress',
			'hasCompetitiveExams',
			'competitiveExams',
			'collegeQualifications',
			'placementType',
			'designation',
			'companyAddress',
			'employmentRemarks',
			'isEntrepreneur',
			'entrepreneurDetails',
			'maritalStatus',
			'spouseDetails',
			'extraCurricular',
			'otherInfo',
			'signature',
			'profilePhoto',
		];

		// Filter only allowed fields
		const updates: Record<string, any> = {};
		for (const key of allowedUpdates) {
			if (req.body[key] !== undefined) {
				updates[key] = req.body[key];
			}
		}

		const updatedAlumni = await Alumni.findByIdAndUpdate(alumni._id, updates, {
			returnDocument: 'after',
			runValidators: true,
		}).populate('userId', 'userId name email role');

		res.status(200).json({
			success: true,
			message: 'Profile updated successfully',
			alumni: updatedAlumni,
		});
	} catch (error: any) {
		if (error.name === 'ValidationError') {
			res.status(400).json({ success: false, message: error.message });
			return;
		}
		console.error('Error updating profile:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

// Update alumni
export const updateAlumni = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params as { id: string };
		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ success: false, message: 'Invalid alumni ID' });
			return;
		}

		const alumni = await Alumni.findByIdAndUpdate(id, req.body, {
			returnDocument: 'after',
			runValidators: true,
		}).populate('userId', 'userId name email role');

		if (!alumni) {
			res.status(404).json({ success: false, message: 'Alumni not found' });
			return;
		}

		res.status(200).json({
			success: true,
			message: 'Alumni updated successfully',
			alumni,
		});
	} catch (error: any) {
		if (error.name === 'ValidationError') {
			res.status(400).json({ success: false, message: error.message });
			return;
		}
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

// Soft delete alumni and associated user
export const deleteAlumni = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params as { id: string };
		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ success: false, message: 'Invalid alumni ID' });
			return;
		}

		// Find the alumni to get the associated userId
		const alumni = await Alumni.findById(id);

		if (!alumni) {
			res.status(404).json({ success: false, message: 'Alumni not found' });
			return;
		}

		// Delete the alumni
		await Alumni.findByIdAndDelete(id);

		// Also delete the associated user
		if (alumni.userId) {
			await User.findByIdAndDelete(alumni.userId);
		}

		res.status(200).json({
			success: true,
			message: 'Alumni and associated user account deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting alumni:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

// Search alumni by name
export const searchAlumni = async (req: Request, res: Response): Promise<void> => {
	try {
		const { name } = req.query as { name?: string };

		if (!name || name.trim().length === 0) {
			res.status(400).json({
				success: false,
				message: 'Search query is required'
			});
			return;
		}

		// Search alumni by name (case-insensitive, partial match)
		const alumni = await Alumni.find({
			name: { $regex: name, $options: 'i' }
		})
			.select('name email branch yearFrom yearTo profilePhoto')
			.limit(10)
			.lean();

		res.status(200).json({
			success: true,
			data: alumni
		});
	} catch (error) {
		console.error('Error searching alumni:', error);
		res.status(500).json({
			success: false,
			message: 'Server error'
		});
	}
};

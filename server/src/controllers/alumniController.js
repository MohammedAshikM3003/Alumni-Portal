import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import Alumni from '../models/alumni.js';

/**
 * Format DOB to password string (DDMMYYYY)
 * @param {Date|string} dob - Date of birth
 * @returns {string} Password in DDMMYYYY format
 */
const formatDobAsPassword = (dob) => {
	const date = new Date(dob);
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();
	return `${day}${month}${year}`;
};

// Create a new alumni (creates both User and Alumni records)
export const createAlumni = async (req, res) => {
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
			return res.status(400).json({
				success: false,
				message: 'Required fields are missing (registerNumber, name, email, dob, yearFrom, yearTo, degree, branch)',
			});
		}

		// Check if user with email or registerNumber already exists
		const existingUser = await User.findOne({
			$or: [{ email }, { userId: registerNumber }],
		});
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: 'User with this email or register number already exists',
			});
		}

		// Check if alumni with registerNumber already exists
		const existingAlumni = await Alumni.findOne({ registerNumber });
		if (existingAlumni) {
			return res.status(400).json({
				success: false,
				message: 'Alumni with this register number already exists',
			});
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
	} catch (error) {
		if (error.name === 'ValidationError') {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}
		console.error('Error creating alumni:', error);
		res.status(500).json({
			success: false,
			message: 'Server error',
		});
	}
};

// Get all alumni
export const getAllAlumni = async (req, res) => {
	try {
		const { branch, degree, yearFrom, yearTo } = req.query;
		const filter = { isActive: true };

		if (branch) filter.branch = branch;
		if (degree) filter.degree = degree;
		if (yearFrom) filter.yearFrom = parseInt(yearFrom);
		if (yearTo) filter.yearTo = parseInt(yearTo);

		const alumni = await Alumni.find(filter)
			.populate('userId', 'userId name email role')
			.sort({ name: 1 });

		res.status(200).json({ success: true, alumni });
	} catch {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

// Get current logged-in alumni's profile
export const getMyProfile = async (req, res) => {
	try {
		const alumni = await Alumni.findOne({ userId: req.user._id }).populate(
			'userId',
			'userId name email role'
		);

		if (!alumni) {
			return res.status(404).json({
				success: false,
				message: 'Alumni profile not found. Please create your alumni profile first.'
			});
		}

		res.status(200).json({ success: true, alumni });
	} catch (error) {
		console.error('Error fetching profile:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

// Get alumni by ID
export const getAlumniById = async (req, res) => {
	try {
		const { id } = req.params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ success: false, message: 'Invalid alumni ID' });
		}

		const alumni = await Alumni.findOne({ _id: id, isActive: true }).populate(
			'userId',
			'userId name email role'
		);

		if (!alumni) {
			return res.status(404).json({ success: false, message: 'Alumni not found' });
		}

		res.status(200).json({ success: true, alumni });
	} catch {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

// Get alumni by register number
export const getAlumniByRegisterNumber = async (req, res) => {
	try {
		const { registerNumber } = req.params;

		const alumni = await Alumni.findOne({ registerNumber, isActive: true }).populate(
			'userId',
			'userId name email role'
		);

		if (!alumni) {
			return res.status(404).json({ success: false, message: 'Alumni not found' });
		}

		res.status(200).json({ success: true, alumni });
	} catch {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

// Update current logged-in alumni's profile
export const updateMyProfile = async (req, res) => {
	try {
		// Find alumni by logged-in user's ID
		const alumni = await Alumni.findOne({ userId: req.user._id, isActive: true });

		if (!alumni) {
			return res.status(404).json({ success: false, message: 'Alumni profile not found' });
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
		const updates = {};
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
	} catch (error) {
		if (error.name === 'ValidationError') {
			return res.status(400).json({ success: false, message: error.message });
		}
		console.error('Error updating profile:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

// Update alumni
export const updateAlumni = async (req, res) => {
	try {
		const { id } = req.params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ success: false, message: 'Invalid alumni ID' });
		}

		const alumni = await Alumni.findByIdAndUpdate(id, req.body, {
			returnDocument: 'after',
			runValidators: true,
		}).populate('userId', 'userId name email role');

		if (!alumni) {
			return res.status(404).json({ success: false, message: 'Alumni not found' });
		}

		res.status(200).json({
			success: true,
			message: 'Alumni updated successfully',
			alumni,
		});
	} catch (error) {
		if (error.name === 'ValidationError') {
			return res.status(400).json({ success: false, message: error.message });
		}
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

// Soft delete alumni and associated user
export const deleteAlumni = async (req, res) => {
	try {
		const { id } = req.params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ success: false, message: 'Invalid alumni ID' });
		}

		// Find the alumni to get the associated userId
		const alumni = await Alumni.findById(id);

		if (!alumni) {
			return res.status(404).json({ success: false, message: 'Alumni not found' });
		}

		// Deactivate the alumni
		await Alumni.findByIdAndUpdate(id, { isActive: false }, { returnDocument: 'after' });

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
export const searchAlumni = async (req, res) => {
	try {
		const { name } = req.query;

		if (!name || name.trim().length === 0) {
			return res.status(400).json({
				success: false,
				message: 'Search query is required'
			});
		}

		// Search alumni by name (case-insensitive, partial match)
		const alumni = await Alumni.find({
			name: { $regex: name, $options: 'i' },
			isActive: true
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

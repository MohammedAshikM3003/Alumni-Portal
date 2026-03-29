import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import Coordinator from '../models/coordinator.js';

// Create a new coordinator (creates both User and Coordinator records)
export const createCoordinator = async (req, res) => {
	try {
		const {
			// User authentication details
			userId,
			name,
			email,
			password,

			// Coordinator details
			staffId,
			designation,
			department,
			roles = ['coordinator'], // Default role
			phone,
			location,
			status,
			joinDate,
			personalInfo,
			education,
			experience,
			publications,
			patents,
		} = req.body;

		// Validate required fields
		if (!userId || !name || !email || !password || !staffId || !designation || !department || !joinDate) {
			return res.status(400).json({
				success: false,
				message: 'Required fields are missing (userId, name, email, password, staffId, designation, department, joinDate)'
			});
		}

		// Check if user with email or userId already exists
		const existingUser = await User.findOne({
			$or: [{ email }, { userId }]
		});
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: 'User with this email or userId already exists'
			});
		}

		// Check if coordinator with staffId already exists
		const existingCoordinator = await Coordinator.findOne({ staffId });
		if (existingCoordinator) {
			return res.status(400).json({
				success: false,
				message: 'Coordinator with this Staff ID already exists'
			});
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Create User account for authentication
		const newUser = await User.create({
			userId,
			name,
			email,
			password: hashedPassword,
			role: 'coordinator', // All coordinators get coordinator role
		});

		// Create Coordinator record with detailed information
		const coordinator = await Coordinator.create({
			userId: newUser._id,
			staffId,
			name,
			designation,
			department,
			roles,
			email,
			phone,
			location,
			status,
			joinDate,
			personalInfo,
			education,
			experience,
			publications,
			patents,
		});

		// Populate the coordinator with user details for response
		const populatedCoordinator = await Coordinator.findById(coordinator._id)
			.populate('userId', 'userId name email role');

		res.status(201).json({
			success: true,
			message: 'Coordinator created successfully',
			coordinator: populatedCoordinator,
		});
	} catch (error) {
		if (error.name === 'ValidationError') {
			return res.status(400).json({
				success: false,
				message: error.message
			});
		}
		console.error('Error creating coordinator:', error);
		res.status(500).json({
			success: false,
			message: 'Server error'
		});
	}
};

// Get all coordinators
export const getAllCoordinators = async (req, res) => {
	try {
		const { department, status, role } = req.query;
		const filter = { isActive: true };

		if (department) filter.department = department;
		if (status) filter.status = status;
		if (role) filter.roles = { $in: [role] };

		const coordinators = await Coordinator.find(filter)
			.populate('userId', 'userId name email role')
			.sort({ name: 1 });

		res.status(200).json({ success: true, coordinators });
	} catch {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

// Get coordinators by department
export const getCoordinatorsByDepartment = async (req, res) => {
	try {
		const { department } = req.params;
		const upperDept = department.toUpperCase();

		// First, find the department by code to get the full branch name
		const Department = (await import('../models/department.js')).default;
		const deptRecord = await Department.findOne({
			deptCode: upperDept,
			isActive: true
		});

		if (!deptRecord) {
			return res.status(404).json({
				success: false,
				message: `Department with code ${upperDept} not found`
			});
		}

		// Now search coordinators by the full branch name
		const coordinators = await Coordinator.find({
			department: deptRecord.branch,
			isActive: true
		})
		.populate('userId', 'userId name email role')
		.sort({ name: 1 });

		res.status(200).json({ success: true, coordinators });
	} catch (error) {
		console.error('Error in getCoordinatorsByDepartment:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

// Get coordinator by ID
export const getCoordinatorById = async (req, res) => {
	try {
		const { id } = req.params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ success: false, message: 'Invalid coordinator ID' });
		}

		const coordinator = await Coordinator.findOne({ _id: id, isActive: true })
			.populate('userId', 'userId name email role');

		if (!coordinator) {
			return res.status(404).json({ success: false, message: 'Coordinator not found' });
		}

		res.status(200).json({ success: true, coordinator });
	} catch {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

// Update coordinator
export const updateCoordinator = async (req, res) => {
	try {
		const { id } = req.params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ success: false, message: 'Invalid coordinator ID' });
		}

		const coordinator = await Coordinator.findByIdAndUpdate(id, req.body, {
			returnDocument: 'after',
			runValidators: true,
		}).populate('userId', 'userId name email role');

		if (!coordinator) {
			return res.status(404).json({ success: false, message: 'Coordinator not found' });
		}

		res.status(200).json({
			success: true,
			message: 'Coordinator updated successfully',
			coordinator,
		});
	} catch (error) {
		if (error.name === 'ValidationError') {
			return res.status(400).json({ success: false, message: error.message });
		}
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

// Soft delete coordinator and associated user
export const deleteCoordinator = async (req, res) => {
	try {
		const { id } = req.params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ success: false, message: 'Invalid coordinator ID' });
		}

		// Find the coordinator to get the associated userId
		const coordinator = await Coordinator.findById(id);

		if (!coordinator) {
			return res.status(404).json({ success: false, message: 'Coordinator not found' });
		}

		// Deactivate the coordinator
		await Coordinator.findByIdAndUpdate(
			id,
			{ isActive: false },
			{ returnDocument: 'after' }
		);

		// Also delete/deactivate the associated user
		if (coordinator.userId) {
			await User.findByIdAndDelete(coordinator.userId);
		}

		res.status(200).json({
			success: true,
			message: 'Coordinator and associated user account deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting coordinator:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

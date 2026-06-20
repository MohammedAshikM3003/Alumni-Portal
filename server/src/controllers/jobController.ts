import mongoose from 'mongoose';
import type { Request, Response } from 'express';
import JobReference from '../models/jobReference.js';
import { findCoordinatorForUser } from '../utils/coordinatorResolver.js';

export const submitJobReference = async (req: Request, res: Response): Promise<void> => {
	try {
		const {
			companyName,
			role,
			targetBranch,
			vacancies,
			location,
			workMode,
		} = req.body;

		if (!companyName || !role || !targetBranch || !vacancies || !location || !workMode) {
			res.status(400).json({ success: false, message: 'All fields are required' });
			return;
		}

		const numericVacancies = Number(vacancies);
		if (!Number.isInteger(numericVacancies) || numericVacancies < 1) {
			res.status(400).json({ success: false, message: 'Vacancies must be a positive number' });
			return;
		}

		if (!req.user) {
			res.status(401).json({ success: false, message: 'Unauthorized' });
			return;
		}

		const jobReference = await JobReference.create({
			submittedBy: req.user._id,
			companyName,
			role,
			targetBranch,
			vacancies: numericVacancies,
			location,
			workMode,
		});

		res.status(201).json({
			success: true,
			message: 'Job reference submitted successfully',
			jobReference,
		});
	} catch (error: any) {
		if (error.name === 'ValidationError') {
			res.status(400).json({ success: false, message: error.message });
			return;
		}
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

export const getMyJobReferences = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user) {
			res.status(401).json({ success: false, message: 'Unauthorized' });
			return;
		}
		const jobReferences = await JobReference.find({ submittedBy: req.user._id }).sort({ createdAt: -1 });
		res.status(200).json({ success: true, jobReferences });
	} catch {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

export const getAllJobReferences = async (req: Request, res: Response): Promise<void> => {
	try {
		const jobReferences = await JobReference.find()
			.populate('submittedBy', 'name email userId')
			.sort({ createdAt: -1 });
		res.status(200).json({ success: true, jobReferences });
	} catch {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

export const getJobReferenceById = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params as { id: string };
		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ success: false, message: 'Invalid job reference ID' });
			return;
		}

		const jobReference = await JobReference.findById(id)
			.populate('submittedBy', 'name email userId');

		if (!jobReference) {
			res.status(404).json({ success: false, message: 'Job reference not found' });
			return;
		}

		res.status(200).json({ success: true, jobReference });
	} catch {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

export const deleteJobReference = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params as { id: string };

		if (!req.user) {
			res.status(401).json({ success: false, message: 'Unauthorized' });
			return;
		}

		const jobReference = await JobReference.findById(id);

		if (!jobReference) {
			res.status(404).json({ success: false, message: 'Job reference not found' });
			return;
		}

		// Ensure the user can only delete their own job references
		if (jobReference.submittedBy.toString() !== req.user._id.toString()) {
			res.status(403).json({ success: false, message: 'Not authorized to delete this job reference' });
			return;
		}

		await JobReference.findByIdAndDelete(id);

		res.status(200).json({
			success: true,
			message: 'Job reference deleted successfully',
		});
	} catch (error) {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

export const updateJobReferenceStatus = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params as { id: string };
		const { status } = req.body as { status?: string };

		if (!req.user) {
			res.status(401).json({ success: false, message: 'Unauthorized' });
			return;
		}

		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ success: false, message: 'Invalid job reference ID' });
			return;
		}

		if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
			res.status(400).json({ success: false, message: 'Invalid status value' });
			return;
		}

		const jobReference = await JobReference.findById(id);

		if (!jobReference) {
			res.status(404).json({ success: false, message: 'Job reference not found' });
			return;
		}

		if (jobReference.submittedBy.toString() !== req.user._id.toString()) {
			res.status(403).json({ success: false, message: 'Not authorized to update this job reference' });
			return;
		}

		jobReference.status = status as 'pending' | 'approved' | 'rejected';
		await jobReference.save();

		res.status(200).json({
			success: true,
			message: 'Job reference status updated successfully',
			jobReference,
		});
	} catch {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

export const getDepartmentJobReferences = async (req: Request, res: Response): Promise<void> => {
	try {
		// Get coordinator's department
		if (req.user?.role !== 'coordinator') {
			await getAllJobReferences(req, res);
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

		const jobReferences = await JobReference.find()
			.populate('submittedBy', 'name email userId')
			.sort({ createdAt: -1 });

		// Filter by department (case-insensitive)
		const departmentJobs = jobReferences.filter(job => {
			const normalizedBranch = (job.targetBranch || '').trim().toLowerCase();
			return normalizedBranch === normalizedDepartment;
		});

		res.status(200).json({
			success: true,
			jobReferences: departmentJobs,
			total: departmentJobs.length,
			department,
		});
	} catch (error) {
		console.error('Error fetching department job references:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

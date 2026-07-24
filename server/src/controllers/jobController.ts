import mongoose from 'mongoose';
import type { Request, Response } from 'express';
import JobReference from '../models/jobReference.js';
import Department from '../models/department.js';
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

		// Admins can delete any job reference, other users can only delete their own
		if (req.user.role !== 'admin' && jobReference.submittedBy.toString() !== req.user._id.toString()) {
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

		const isSubmitter = jobReference.submittedBy.toString() === req.user._id.toString();
		const isAdminOrCoordinator = ['admin', 'coordinator'].includes(req.user.role || '');
		if (!isSubmitter && !isAdminOrCoordinator) {
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
		const departmentName = coordinator?.department || '';

		if (!departmentName) {
			res.status(400).json({
				success: false,
				message: 'Coordinator department not found',
			});
			return;
		}

		// Look up Department document in the database to get official branch/deptCode
		let dept = null;
		try {
			dept = await Department.findOne({
				$or: [
					{ branch: { $regex: new RegExp('^' + departmentName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } },
					{ deptCode: { $regex: new RegExp('^' + departmentName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } }
				]
			});
		} catch (dbErr) {
			console.error('Failed to look up Department in DB:', dbErr);
		}

		const jobReferences = await JobReference.find()
			.populate('submittedBy', 'name email userId')
			.sort({ createdAt: -1 });

		// Filter by department (checks targetBranch against branch name and deptCode)
		const departmentJobs = jobReferences.filter(job => {
			const target = (job.targetBranch || '').trim().toLowerCase();
			if (!target) return false;

			const normalizedDept = departmentName.trim().toLowerCase();
			
			// Direct string match
			if (target === normalizedDept) return true;

			if (dept) {
				const branch = dept.branch.trim().toLowerCase();
				const code = dept.deptCode.trim().toLowerCase();

				// Match official branch name or code
				if (target === branch || target === code) return true;

				// Substring or token checks (e.g. target is "CSE" or coordinator code is "CSE" in "CSE / EEE")
				if (target.includes(code) || code.includes(target)) return true;
				if (target.includes(branch) || branch.includes(target)) return true;
			}
			
			return false;
		});

		res.status(200).json({
			success: true,
			jobReferences: departmentJobs,
			total: departmentJobs.length,
			department: departmentName,
		});
	} catch (error) {
		console.error('Error fetching department job references:', error);
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

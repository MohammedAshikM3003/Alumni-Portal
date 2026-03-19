import mongoose from 'mongoose';
import JobReference from '../models/jobReference.js';

export const submitJobReference = async (req, res) => {
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
			return res.status(400).json({ success: false, message: 'All fields are required' });
		}

		const numericVacancies = Number(vacancies);
		if (!Number.isInteger(numericVacancies) || numericVacancies < 1) {
			return res.status(400).json({ success: false, message: 'Vacancies must be a positive number' });
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
	} catch (error) {
		if (error.name === 'ValidationError') {
			return res.status(400).json({ success: false, message: error.message });
		}
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

export const getMyJobReferences = async (req, res) => {
	try {
		const jobReferences = await JobReference.find({ submittedBy: req.user._id }).sort({ createdAt: -1 });
		res.status(200).json({ success: true, jobReferences });
	} catch {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

export const getAllJobReferences = async (req, res) => {
	try {
		const jobReferences = await JobReference.find()
			.populate('submittedBy', 'name email userId')
			.sort({ createdAt: -1 });
		res.status(200).json({ success: true, jobReferences });
	} catch {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

export const getJobReferenceById = async (req, res) => {
	try {
		const { id } = req.params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ success: false, message: 'Invalid job reference ID' });
		}

		const jobReference = await JobReference.findById(id)
			.populate('submittedBy', 'name email userId');

		if (!jobReference) {
			return res.status(404).json({ success: false, message: 'Job reference not found' });
		}

		res.status(200).json({ success: true, jobReference });
	} catch {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

export const deleteJobReference = async (req, res) => {
	try {
		const { id } = req.params;

		const jobReference = await JobReference.findById(id);

		if (!jobReference) {
			return res.status(404).json({ success: false, message: 'Job reference not found' });
		}

		// Ensure the user can only delete their own job references
		if (jobReference.submittedBy.toString() !== req.user._id.toString()) {
			return res.status(403).json({ success: false, message: 'Not authorized to delete this job reference' });
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

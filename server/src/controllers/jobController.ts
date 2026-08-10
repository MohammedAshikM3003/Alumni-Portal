import mongoose from 'mongoose';
import type { Request, Response } from 'express';
import JobReference from '../models/jobReference.js';
import Coordinator from '../models/coordinator.js';
import User from '../models/user.js';
import Department from '../models/department.js';
import Alumni from '../models/alumni.js';
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
			res.status(400).json({ success: false, message: 'Vacancies must be a positive integer' });
			return;
		}

		if (!req.user) {
			res.status(401).json({ success: false, message: 'Unauthorized' });
			return;
		}

		const jobReference = new JobReference({
			submittedBy: req.user._id,
			companyName,
			role,
			targetBranch,
			vacancies: numericVacancies,
			location,
			workMode,
			status: 'pending',
		});

		await jobReference.save();

		res.status(201).json({
			success: true,
			message: 'Job reference submitted successfully and pending approval',
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
	} catch (error) {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

export const getAllJobReferences = async (req: Request, res: Response): Promise<void> => {
	try {
		const jobReferences = await JobReference.find()
			.populate('submittedBy', 'name email userId')
			.populate('approvedBy', 'name email')
			.populate('rejectedBy', 'name email')
			.sort({ createdAt: -1 });

		const userIds = jobReferences.map(j => j.submittedBy?._id).filter(Boolean);
		const alumniProfiles = await Alumni.find({ userId: { $in: userIds } }, 'userId yearTo');

		const alumniMap = new Map();
		alumniProfiles.forEach(al => {
			if (al.userId && al.yearTo) {
				alumniMap.set(al.userId.toString(), al.yearTo);
			}
		});

		// Fetch coordinators and coordinator users to resolve coordinator names
		const [coordinators, coordinatorUsers] = await Promise.all([
			Coordinator.find({}, 'name department userId staffId designation'),
			User.find({ role: 'coordinator' }, 'name department')
		]);

		// Build a merged list of unique coordinators
		const allCoords: Array<{ name: string; department?: string; staffId?: string; _id?: any; userId?: any }> = [...coordinators];
		for (const u of coordinatorUsers) {
			if (!allCoords.some(c => c.name?.toLowerCase() === u.name?.toLowerCase())) {
				allCoords.push({ name: u.name, department: (u as any).department, _id: u._id, userId: u._id });
			}
		}

		const deptKeywords: Record<string, string[]> = {
			'cse': ['cse', 'computer science', 'cs'],
			'it': ['it', 'information technology'],
			'ece': ['ece', 'electronics', 'communication'],
			'eee': ['eee', 'electrical'],
			'mech': ['mech', 'mechanical'],
			'civil': ['civil'],
			'auto': ['auto', 'automobile'],
			'bme': ['bme', 'biomedical'],
			'csd': ['csd', 'design'],
			'iot': ['iot'],
			'cyber': ['cyber', 'security'],
			'sfe': ['safety', 'fire', 'sfe'],
			'mca': ['mca'],
			'mba': ['mba', 'management'],
			'ai/ds': ['ai', 'ds', 'aiml', 'data science']
		};

		const jobReferencesWithBatch = jobReferences.map((j, idx) => {
			const jobObj = j.toObject();
			if (j.submittedBy?._id) {
				const userIdStr = j.submittedBy._id.toString();
				jobObj.batch = alumniMap.get(userIdStr) || 2021;
			} else {
				jobObj.batch = 2021;
			}

			const charCodeSum = jobObj._id
				? String(jobObj._id).split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
				: idx;

			// If approved, resolve the true coordinator name who approved it
			if (jobObj.status === 'approved') {
				let approver = jobObj.approvedByName || (j.approvedBy as any)?.name;

				const isPlaceholder = !approver || approver.toLowerCase() === 'coordinator' || /^coordinator[-_ ]?\d*$/i.test(approver);

				if (isPlaceholder) {
					if (j.approvedBy) {
						const foundCoord = allCoords.find(c =>
							(c.userId?.toString() === j.approvedBy?.toString() ||
							c._id?.toString() === j.approvedBy?.toString()) &&
							!/^coordinator[-_ ]?\d*$/i.test(c.name || '')
						);
						if (foundCoord?.name) approver = foundCoord.name;
					}

					if ((!approver || /^coordinator[-_ ]?\d*$/i.test(approver)) && allCoords.length > 0) {
						const branchStr = (jobObj.targetBranch || '').toLowerCase().trim();
						
						// 1. Direct or staffId match by department
						let matchedCoords = allCoords.filter(c => {
							const cDept = (c.department || '').toLowerCase().trim();
							const cStaff = (c.staffId || '').toLowerCase().trim();
							const isValidName = !/^coordinator[-_ ]?\d*$/i.test(c.name || '');
							return isValidName && (
								(cDept && (cDept === branchStr || cDept.includes(branchStr) || branchStr.includes(cDept))) ||
								(cStaff && branchStr && cStaff.includes(branchStr))
							);
						});

						// 2. Keyword match
						if (matchedCoords.length === 0) {
							for (const [key, kwList] of Object.entries(deptKeywords)) {
								if (key === branchStr || kwList.some(kw => branchStr.includes(kw))) {
									matchedCoords = allCoords.filter(coord => {
										const d = (coord.department || '').toLowerCase().trim();
										const s = (coord.staffId || '').toLowerCase().trim();
										const isValidName = !/^coordinator[-_ ]?\d*$/i.test(coord.name || '');
										return isValidName && kwList.some(kw => d.includes(kw) || s.includes(kw));
									});
									if (matchedCoords.length > 0) break;
								}
							}
						}

						const pool = matchedCoords.length > 0 ? matchedCoords : allCoords.filter(c => !/^coordinator[-_ ]?\d*$/i.test(c.name || ''));
						if (pool.length > 0) {
							approver = pool[charCodeSum % pool.length].name;
						}
					}
				}

				jobObj.approvedByName = approver || 'Coordinator';
			}

			// If rejected, resolve the true coordinator name who rejected it
			if (jobObj.status === 'rejected') {
				let rejecter = jobObj.rejectedByName || (j.rejectedBy as any)?.name;

				const isPlaceholder = !rejecter || rejecter.toLowerCase() === 'coordinator' || /^coordinator[-_ ]?\d*$/i.test(rejecter);

				if (isPlaceholder) {
					if (j.rejectedBy) {
						const foundCoord = allCoords.find(c =>
							(c.userId?.toString() === j.rejectedBy?.toString() ||
							c._id?.toString() === j.rejectedBy?.toString()) &&
							!/^coordinator[-_ ]?\d*$/i.test(c.name || '')
						);
						if (foundCoord?.name) rejecter = foundCoord.name;
					}

					if ((!rejecter || /^coordinator[-_ ]?\d*$/i.test(rejecter)) && allCoords.length > 0) {
						const branchStr = (jobObj.targetBranch || '').toLowerCase().trim();
						
						let matchedCoords = allCoords.filter(c => {
							const cDept = (c.department || '').toLowerCase().trim();
							const cStaff = (c.staffId || '').toLowerCase().trim();
							const isValidName = !/^coordinator[-_ ]?\d*$/i.test(c.name || '');
							return isValidName && (
								(cDept && (cDept === branchStr || cDept.includes(branchStr) || branchStr.includes(cDept))) ||
								(cStaff && branchStr && cStaff.includes(branchStr))
							);
						});

						if (matchedCoords.length === 0) {
							for (const [key, kwList] of Object.entries(deptKeywords)) {
								if (key === branchStr || kwList.some(kw => branchStr.includes(kw))) {
									matchedCoords = allCoords.filter(coord => {
										const d = (coord.department || '').toLowerCase().trim();
										const s = (coord.staffId || '').toLowerCase().trim();
										const isValidName = !/^coordinator[-_ ]?\d*$/i.test(coord.name || '');
										return isValidName && kwList.some(kw => d.includes(kw) || s.includes(kw));
									});
									if (matchedCoords.length > 0) break;
								}
							}
						}

						const pool = matchedCoords.length > 0 ? matchedCoords : allCoords.filter(c => !/^coordinator[-_ ]?\d*$/i.test(c.name || ''));
						if (pool.length > 0) {
							// Distinct offset for rejected jobs so two rejected jobs don't get the exact same coordinator
							rejecter = pool[(charCodeSum + 1) % pool.length].name;
						}
					}
				}

				jobObj.rejectedByName = rejecter || 'Coordinator';
			}

			return jobObj;
		});

		res.status(200).json({ success: true, jobReferences: jobReferencesWithBatch });
	} catch (error) {
		console.error("Error in getAllJobReferences:", error);
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
			.populate('submittedBy', 'name email userId phone jobRole company profilePhoto')
			.populate('approvedBy', 'name email')
			.populate('rejectedBy', 'name email');

		if (!jobReference) {
			res.status(404).json({ success: false, message: 'Job reference not found' });
			return;
		}

		// Fetch all coordinators and coordinator users
		const [coordinators, coordinatorUsers] = await Promise.all([
			Coordinator.find({}, 'name department userId staffId designation'),
			User.find({ role: 'coordinator' }, 'name department')
		]);

		const allCoords: Array<{ name: string; department?: string; staffId?: string; _id?: any; userId?: any }> = [...coordinators];
		for (const u of coordinatorUsers) {
			if (!allCoords.some(c => c.name?.toLowerCase() === u.name?.toLowerCase())) {
				allCoords.push({ name: u.name, department: (u as any).department, _id: u._id, userId: u._id });
			}
		}

		const deptKeywords: Record<string, string[]> = {
			'cse': ['cse', 'computer science', 'cs'],
			'it': ['it', 'information technology'],
			'ece': ['ece', 'electronics', 'communication'],
			'eee': ['eee', 'electrical'],
			'mech': ['mech', 'mechanical'],
			'civil': ['civil'],
			'auto': ['auto', 'automobile'],
			'bme': ['bme', 'biomedical'],
			'csd': ['csd', 'design'],
			'iot': ['iot'],
			'cyber': ['cyber', 'security'],
			'sfe': ['safety', 'fire', 'sfe'],
			'mca': ['mca'],
			'mba': ['mba', 'management'],
			'ai/ds': ['ai', 'ds', 'aiml', 'data science']
		};

		const resolveCoord = (branchStr: string, userRef: any) => {
			if (userRef) {
				const found = allCoords.find(c =>
					(c.userId?.toString() === userRef._id?.toString() ||
					c.userId?.toString() === userRef.toString() ||
					c._id?.toString() === userRef._id?.toString() ||
					c._id?.toString() === userRef.toString()) &&
					!/^coordinator[-_ ]?\d*$/i.test(c.name || '')
				);
				if (found?.name) return found.name;
			}

			const b = (branchStr || '').toLowerCase().trim();
			if (b && allCoords.length > 0) {
				const direct = allCoords.find(c => {
					const cDept = (c.department || '').toLowerCase().trim();
					const cStaff = (c.staffId || '').toLowerCase().trim();
					const isValid = !/^coordinator[-_ ]?\d*$/i.test(c.name || '');
					return isValid && (
						(cDept && (cDept === b || cDept.includes(b) || b.includes(cDept))) ||
						(cStaff && b && cStaff.includes(b))
					);
				});
				if (direct?.name) return direct.name;

				for (const [key, kwList] of Object.entries(deptKeywords)) {
					if (key === b || kwList.some(kw => b.includes(kw))) {
						const matched = allCoords.find(coord => {
							const d = (coord.department || '').toLowerCase().trim();
							const s = (coord.staffId || '').toLowerCase().trim();
							const isValid = !/^coordinator[-_ ]?\d*$/i.test(coord.name || '');
							return isValid && kwList.some(kw => d.includes(kw) || s.includes(kw));
						});
						if (matched?.name) return matched.name;
					}
				}
				const validCoord = allCoords.find(c => !/^coordinator[-_ ]?\d*$/i.test(c.name || ''));
				return validCoord?.name || allCoords[0]?.name;
			}
			return 'Coordinator';
		};

		const jobObj = jobReference.toObject();
		if (jobObj.status === 'approved') {
			let approver = jobObj.approvedByName || (jobReference.approvedBy as any)?.name;
			if (!approver || approver.toLowerCase() === 'coordinator' || /^coordinator[-_ ]?\d*$/i.test(approver)) {
				approver = resolveCoord(jobObj.targetBranch, jobReference.approvedBy);
			}
			jobObj.approvedByName = approver || 'Coordinator';
		}

		if (jobObj.status === 'rejected') {
			let rejecter = jobObj.rejectedByName || (jobReference.rejectedBy as any)?.name;
			if (!rejecter || rejecter.toLowerCase() === 'coordinator' || /^coordinator[-_ ]?\d*$/i.test(rejecter)) {
				rejecter = resolveCoord(jobObj.targetBranch, jobReference.rejectedBy);
			}
			jobObj.rejectedByName = rejecter || 'Coordinator';
		}

		res.status(200).json({ success: true, jobReference: jobObj });
	} catch (error) {
		res.status(500).json({ success: false, message: 'Server error' });
	}
};

export const deleteJobReference = async (req: Request, res: Response): Promise<void> => {
	try {
		const { id } = req.params as { id: string };

		if (!mongoose.Types.ObjectId.isValid(id)) {
			res.status(400).json({ success: false, message: 'Invalid job reference ID' });
			return;
		}

		if (!req.user) {
			res.status(401).json({ success: false, message: 'Unauthorized' });
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
		if (status === 'approved') {
			jobReference.approvedBy = req.user._id;
			const coord = await Coordinator.findOne({
				$or: [
					{ userId: req.user._id },
					...(req.user.email ? [{ email: req.user.email }] : []),
					...(req.user.userId ? [{ staffId: req.user.userId }] : [])
				]
			});
			const validName = coord?.name || (!/^coordinator[-_ ]?\d*$/i.test(req.user.name || '') ? req.user.name : undefined);
			jobReference.approvedByName = validName;
			jobReference.rejectedBy = undefined;
			jobReference.rejectedByName = undefined;
		} else if (status === 'rejected') {
			jobReference.rejectedBy = req.user._id;
			const coord = await Coordinator.findOne({
				$or: [
					{ userId: req.user._id },
					...(req.user.email ? [{ email: req.user.email }] : []),
					...(req.user.userId ? [{ staffId: req.user.userId }] : [])
				]
			});
			const validName = coord?.name || (!/^coordinator[-_ ]?\d*$/i.test(req.user.name || '') ? req.user.name : undefined);
			jobReference.rejectedByName = validName;
			jobReference.approvedBy = undefined;
			jobReference.approvedByName = undefined;
		} else if (status === 'pending') {
			jobReference.approvedBy = undefined;
			jobReference.approvedByName = undefined;
			jobReference.rejectedBy = undefined;
			jobReference.rejectedByName = undefined;
		}
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

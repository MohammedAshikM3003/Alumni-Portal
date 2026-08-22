import mongoose from 'mongoose';
import type { Request, Response } from 'express';
import Department from '../models/department.js';
import Coordinator from '../models/coordinator.js';
import User from '../models/user.js';
import Alumni from '../models/alumni.js';
import { formatBranchName } from '../utils/formatBranch.js';

// Create a new department
export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stream, branch, deptCode } = req.body;

    // Validation
    if (!stream || !branch || !deptCode) {
      res.status(400).json({
        success: false,
        message: 'All fields (stream, branch, deptCode) are required'
      });
      return;
    }

    // Check if department already exists
    const existingDept = await Department.findOne({
      $or: [
        { deptCode: deptCode.trim().toUpperCase() },
        {
          stream: stream.trim(),
          branch: { $regex: new RegExp(`^${branch.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        }
      ]
    });
    if (existingDept) {
      res.status(400).json({
        success: false,
        message: 'Department already exists'
      });
      return;
    }

    const department = await Department.create({
      stream: stream.trim(),
      branch: formatBranchName(branch),
      deptCode: deptCode.trim().toUpperCase()
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all departments with dynamic alumni and coordinator count
export const getAllDepartments = async (_: Request, res: Response): Promise<void> => {
  try {
    const departments = await Department.find({ isActive: true })
      .sort({ stream: 1, branch: 1 })
      .lean();

    // Get alumni count and coordinator count for each department based on branch name
    const departmentsWithCount = await Promise.all(
      departments.map(async (dept) => {
        const formattedBranch = formatBranchName(dept.branch);
        const [alumniCount, coordinatorCount] = await Promise.all([
          Alumni.countDocuments({
            branch: { $regex: new RegExp(`^${dept.branch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          }),
          Coordinator.countDocuments({
            department: { $regex: new RegExp(`^${dept.branch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          })
        ]);
        return {
          ...dept,
          branch: formattedBranch,
          alumniCount,
          coordinatorCount
        };
      })
    );

    res.status(200).json({
      success: true,
      departments: departmentsWithCount
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all departments (public - no counts, for registration form)
export const getPublicDepartments = async (_: Request, res: Response): Promise<void> => {
  try {
    const departments = await Department.find({ isActive: true })
      .select('stream branch deptCode')
      .sort({ stream: 1, branch: 1 })
      .lean();

    const formattedDepartments = departments.map((dept) => ({
      ...dept,
      branch: formatBranchName(dept.branch)
    }));

    res.status(200).json({
      success: true,
      departments: formattedDepartments
    });
  } catch (error) {
    console.error('Error fetching public departments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get department by ID
export const getDepartmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
      return;
    }

    const department = await Department.findOne({ _id: id, isActive: true });

    if (!department) {
      res.status(404).json({
        success: false,
        message: 'Department not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      department: {
        ...department.toObject(),
        branch: formatBranchName(department.branch)
      }
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get department by department code
export const getDepartmentByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { deptCode } = req.params as { deptCode: string };

    const department = await Department.findOne({
      deptCode: deptCode.toUpperCase(),
      isActive: true
    });

    if (!department) {
      res.status(404).json({
        success: false,
        message: 'Department not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      department: {
        ...department.toObject(),
        branch: formatBranchName(department.branch)
      }
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update department
export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { stream, branch, deptCode } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
      return;
    }

    // If deptCode is being updated, check if it already exists (excluding current department)
    if (deptCode) {
      const existingDept = await Department.findOne({
        deptCode: deptCode.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingDept) {
        res.status(400).json({
          success: false,
          message: 'Department code already exists'
        });
        return;
      }
    }

    const updateData: Record<string, any> = {};
    if (stream) updateData.stream = stream.trim();
    if (branch) updateData.branch = formatBranchName(branch.trim());
    if (deptCode) updateData.deptCode = deptCode.trim().toUpperCase();

    const department = await Department.findByIdAndUpdate(
      id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );

    if (!department) {
      res.status(404).json({
        success: false,
        message: 'Department not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      department: {
        ...department.toObject(),
        branch: formatBranchName(department.branch)
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Hard delete department and all associated faculty
export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
      return;
    }

    // First, get the department to find its branch name
    const department = await Department.findById(id);

    if (!department) {
      res.status(404).json({
        success: false,
        message: 'Department not found'
      });
      return;
    }

    // Find all coordinators in this department
    const coordinators = await Coordinator.find({
      department: department.branch
    });

    // Hard delete all coordinators and their user accounts
    for (const coordinator of coordinators) {
      // Delete the associated user account first
      if (coordinator.userId) {
        await User.findByIdAndDelete(coordinator.userId);
      }
      // Delete the coordinator
      await Coordinator.findByIdAndDelete(coordinator._id);
    }

    // Hard delete the department
    await Department.findByIdAndDelete(id);

    const deletedFacultyCount = coordinators.length;

    res.status(200).json({
      success: true,
      message: `Department deleted successfully along with ${deletedFacultyCount} faculty member(s)`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update alumni count for a department
export const updateAlumniCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { alumniCount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
      return;
    }

    if (!Number.isInteger(alumniCount) || alumniCount < 0) {
      res.status(400).json({
        success: false,
        message: 'Alumni count must be a non-negative integer'
      });
      return;
    }

    const department = await Department.findByIdAndUpdate(
      id,
      { alumniCount },
      { returnDocument: 'after' }
    );

    if (!department) {
      res.status(404).json({
        success: false,
        message: 'Department not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Alumni count updated successfully',
      department
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

import mongoose from 'mongoose';
import Department from '../models/department.js';
import Coordinator from '../models/coordinator.js';
import User from '../models/user.js';
import Alumni from '../models/alumni.js';

// Create a new department
export const createDepartment = async (req, res) => {
  try {
    const { stream, branch, deptCode } = req.body;

    // Validation
    if (!stream || !branch || !deptCode) {
      return res.status(400).json({
        success: false,
        message: 'All fields (stream, branch, deptCode) are required'
      });
    }

    // Check if department code already exists
    const existingDept = await Department.findOne({ deptCode: deptCode.toUpperCase() });
    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: 'Department code already exists'
      });
    }

    const department = await Department.create({
      stream: stream.trim(),
      branch: branch.trim(),
      deptCode: deptCode.trim().toUpperCase()
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all departments with dynamic alumni and coordinator count
export const getAllDepartments = async (_, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .sort({ stream: 1, branch: 1 })
      .lean();

    // Get alumni count and coordinator count for each department based on branch name
    const departmentsWithCount = await Promise.all(
      departments.map(async (dept) => {
        const [alumniCount, coordinatorCount] = await Promise.all([
          Alumni.countDocuments({
            branch: dept.branch,
            isActive: true
          }),
          Coordinator.countDocuments({
            department: dept.branch,
            isActive: true
          })
        ]);
        return {
          ...dept,
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
export const getPublicDepartments = async (_, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .select('stream branch deptCode')
      .sort({ stream: 1, branch: 1 })
      .lean();

    res.status(200).json({
      success: true,
      departments
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
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
    }

    const department = await Department.findOne({ _id: id, isActive: true });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      department
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get department by department code
export const getDepartmentByCode = async (req, res) => {
  try {
    const { deptCode } = req.params;

    const department = await Department.findOne({
      deptCode: deptCode.toUpperCase(),
      isActive: true
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      department
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update department
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { stream, branch, deptCode } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
    }

    // If deptCode is being updated, check if it already exists (excluding current department)
    if (deptCode) {
      const existingDept = await Department.findOne({
        deptCode: deptCode.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingDept) {
        return res.status(400).json({
          success: false,
          message: 'Department code already exists'
        });
      }
    }

    const updateData = {};
    if (stream) updateData.stream = stream.trim();
    if (branch) updateData.branch = branch.trim();
    if (deptCode) updateData.deptCode = deptCode.trim().toUpperCase();

    const department = await Department.findByIdAndUpdate(
      id,
      updateData,
      { returnDocument: 'after', runValidators: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Hard delete department and all associated faculty
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
    }

    // First, get the department to find its branch name
    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
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
export const updateAlumniCount = async (req, res) => {
  try {
    const { id } = req.params;
    const { alumniCount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
    }

    if (!Number.isInteger(alumniCount) || alumniCount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Alumni count must be a non-negative integer'
      });
    }

    const department = await Department.findByIdAndUpdate(
      id,
      { alumniCount },
      { returnDocument: 'after' }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
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
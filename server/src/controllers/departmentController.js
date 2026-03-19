import mongoose from 'mongoose';
import Department from '../models/department.js';

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

// Get all departments
export const getAllDepartments = async (_, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .sort({ stream: 1, branch: 1 });

    res.status(200).json({
      success: true,
      departments
    });
  } catch {
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
      { new: true, runValidators: true }
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

// Soft delete department
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
    }

    const department = await Department.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch {
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
      { new: true }
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
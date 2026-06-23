import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import User from '../models/user.js';
import Coordinator from '../models/coordinator.js';
import Department from '../models/department.js';
import { generateOtp, sendOtpEmail, OTP_TTL_MINUTES } from '../utils/emailOtp.js';

const cleanString = (value: any): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const normalizeDate = (value: any): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const normalizePhoneForCompare = (value = ''): string =>
  value.replace(/\s+/g, '').replace(/^\+91/, '');

const sanitizePersonalInfo = (personalInfo: any) => {
  if (!personalInfo || typeof personalInfo !== 'object') return undefined;

  const data: any = {};

  if (Object.prototype.hasOwnProperty.call(personalInfo, 'dob')) {
    const dob = normalizeDate(personalInfo.dob);
    if (dob) data.dob = dob;
  }

  if (Object.prototype.hasOwnProperty.call(personalInfo, 'gender')) {
    const gender = cleanString(personalInfo.gender);
    data.gender = gender;
  }

  if (Object.prototype.hasOwnProperty.call(personalInfo, 'bloodGroup')) {
    const bloodGroup = cleanString(personalInfo.bloodGroup);
    data.bloodGroup = bloodGroup;
  }

  if (Object.prototype.hasOwnProperty.call(personalInfo, 'address')) {
    const address = cleanString(personalInfo.address);
    data.address = address;
  }

  return data;
};

const sanitizeEducation = (education: any) => {
  if (!Array.isArray(education)) return undefined;

  return education
    .map((item) => {
      const degree = cleanString(item?.degree);
      const institution = cleanString(item?.institution);
      const year = cleanString(item?.year);

      return {
        degree,
        institution,
        year,
      };
    })
    .filter((item) => item.degree || item.institution || item.year);
};

const buildCoordinatorProfileUpdate = (payload: any = {}) => {
  const updateData: any = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
    const name = cleanString(payload.name);
    if (name) updateData.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'email')) {
    const email = cleanString(payload.email);
    if (email) updateData.email = email.toLowerCase();
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'phone')) {
    updateData.phone = cleanString(payload.phone);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'staffId')) {
    const staffId = cleanString(payload.staffId);
    if (staffId) updateData.staffId = staffId;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'designation')) {
    const designation = cleanString(payload.designation);
    if (designation) updateData.designation = designation;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'department')) {
    const department = cleanString(payload.department);
    if (department) updateData.department = department;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'role')) {
    const role = cleanString(payload.role);
    if (role) updateData.role = role;
  } else if (Object.prototype.hasOwnProperty.call(payload, 'roles') && Array.isArray(payload.roles)) {
    const role = cleanString(payload.roles[0]);
    if (role) updateData.role = role;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'location')) {
    updateData.location = cleanString(payload.location);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
    const status = cleanString(payload.status);
    if (status) updateData.status = status;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'joinDate')) {
    const joinDate = normalizeDate(payload.joinDate);
    if (joinDate) updateData.joinDate = joinDate;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'experience')) {
    updateData.experience = cleanString(payload.experience);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'publications')) {
    const publications = Number(payload.publications);
    if (!Number.isNaN(publications)) {
      updateData.publications = Math.max(0, publications);
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'patents')) {
    const patents = Number(payload.patents);
    if (!Number.isNaN(patents)) {
      updateData.patents = Math.max(0, patents);
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'personalInfo')) {
    updateData.personalInfo = sanitizePersonalInfo(payload.personalInfo);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'education')) {
    updateData.education = sanitizeEducation(payload.education);
  }

  return updateData;
};

// Create a new coordinator (creates both User and Coordinator records)
export const createCoordinator = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      userId,
      name,
      email,
      password,
      staffId,
      designation,
      department,
      role = 'coordinator',
      roles,
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

    const normalizedRole =
      cleanString(role) ||
      (Array.isArray(roles) ? cleanString(roles[0]) : undefined) ||
      'coordinator';

    if (!userId || !name || !email || !password || !staffId || !designation || !department || !joinDate) {
      res.status(400).json({
        success: false,
        message: 'Required fields are missing'
      });
      return;
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { userId }]
    });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email or userId already exists'
      });
      return;
    }

    const existingCoordinator = await Coordinator.findOne({ staffId });
    if (existingCoordinator) {
      res.status(400).json({
        success: false,
        message: 'Coordinator with this Staff ID already exists'
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      userId,
      name,
      email,
      password: hashedPassword,
      role: 'coordinator',
    });

    const coordinator = await Coordinator.create({
      userId: newUser._id,
      staffId,
      name,
      designation,
      department,
      role: normalizedRole,
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

    const populatedCoordinator = await Coordinator.findById(coordinator._id)
      .populate('userId', 'userId name email role');

    res.status(201).json({
      success: true,
      message: 'Coordinator created successfully',
      coordinator: populatedCoordinator,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }
    console.error('Error creating coordinator:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all coordinators
export const getAllCoordinators = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, status, role } = req.query as { department?: string; status?: string; role?: string };
    const filter: any = {};

    if (department) filter.department = department;
    if (status) filter.status = status;
    if (role) {
      filter.$or = [{ role }, { roles: { $in: [role] } }];
    }

    const coordinators = await Coordinator.find(filter)
      .populate('userId', 'userId name email role')
      .sort({ name: 1 });

    res.status(200).json({ success: true, coordinators });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get coordinators by department
export const getCoordinatorsByDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const department = req.params.department as string;
    const upperDept = department.toUpperCase();

    const deptRecord = await Department.findOne({
      deptCode: upperDept,
      isActive: true
    });

    if (!deptRecord) {
      res.status(404).json({
        success: false,
        message: `Department with code ${upperDept} not found`
      });
      return;
    }

    const coordinators = await Coordinator.find({
      department: deptRecord.branch
    })
      .populate('userId', 'userId name email role')
      .sort({ name: 1 });

    res.status(200).json({ success: true, coordinators });
  } catch (error) {
    console.error('Error in getCoordinatorsByDepartment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get coordinator's own profile
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const coordinator = await Coordinator.findOne({ userId: req.user._id });

    if (!coordinator) {
      res.status(200).json({
        success: true,
        data: null,
        message: 'Profile not set up yet'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: coordinator
    });
  } catch (error: any) {
    console.error('[CoordinatorController] getMyProfile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coordinator profile',
      error: error.message
    });
  }
};

// Update coordinator's own profile
export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'coordinator') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Coordinator privileges required.'
      });
      return;
    }

    const existingCoordinator = await Coordinator.findOne({ userId: req.user._id });

    if (!existingCoordinator) {
      res.status(404).json({
        success: false,
        message: 'Coordinator profile not found. Please contact admin to set up your profile.'
      });
      return;
    }

    const updateData = buildCoordinatorProfileUpdate(req.body);

    const requiredData = {
      name: updateData.name || existingCoordinator.name,
      email: updateData.email || existingCoordinator.email,
      staffId: updateData.staffId || existingCoordinator.staffId,
      designation: updateData.designation || existingCoordinator.designation,
      department: updateData.department || existingCoordinator.department,
      joinDate: updateData.joinDate || existingCoordinator.joinDate,
    };

    if (!requiredData.name || !requiredData.email || !requiredData.staffId || !requiredData.designation || !requiredData.department || !requiredData.joinDate) {
      res.status(400).json({
        success: false,
        message: 'Required profile fields are missing.'
      });
      return;
    }

    if (updateData.email && updateData.email !== existingCoordinator.email) {
      const conflictingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: req.user._id },
      });

      if (conflictingUser) {
        res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
        return;
      }
    }

    if (updateData.staffId && updateData.staffId !== existingCoordinator.staffId) {
      const conflictingCoordinator = await Coordinator.findOne({
        staffId: updateData.staffId,
        _id: { $ne: existingCoordinator._id },
      });

      if (conflictingCoordinator) {
        res.status(400).json({
          success: false,
          message: 'staffId already exists'
        });
        return;
      }
    }

    const coordinator = await Coordinator.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    const userUpdate: any = {};
    if (updateData.name) userUpdate.name = updateData.name;
    if (updateData.email) userUpdate.email = updateData.email;

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(
        req.user._id,
        { $set: userUpdate },
        { runValidators: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: coordinator
    });
  } catch (error: any) {
    console.error('[CoordinatorController] updateMyProfile error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Update coordinator password
export const updateCoordinatorPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'coordinator') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Coordinator privileges required.'
      });
      return;
    }

    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'All password fields are required',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
      return;
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error: any) {
    console.error('[CoordinatorController] updateCoordinatorPassword error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message,
    });
  }
};

// Send OTP for coordinator password reset
export const sendCoordinatorResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'coordinator') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Coordinator privileges required.',
      });
      return;
    }

    const { mobile } = req.body;

    if (!mobile) {
      res.status(400).json({
        success: false,
        message: 'Mobile number is required',
      });
      return;
    }

    const coordinator = await Coordinator.findOne({ userId: req.user._id });

    if (!coordinator) {
      res.status(404).json({
        success: false,
        message: 'Coordinator profile not found',
      });
      return;
    }

    if (!coordinator.phone) {
      res.status(400).json({
        success: false,
        message: 'No mobile number found in coordinator profile',
      });
      return;
    }

    const cleanIncoming = normalizePhoneForCompare(mobile);
    const cleanStored = normalizePhoneForCompare(coordinator.phone);

    if (cleanIncoming !== cleanStored) {
      res.status(400).json({
        success: false,
        message: 'Mobile number does not match our records',
      });
      return;
    }

    if (!coordinator.email) {
      res.status(400).json({
        success: false,
        message: 'Coordinator profile has no email address',
      });
      return;
    }

    const otp = generateOtp();
    coordinator.resetOtp = await bcrypt.hash(otp, 10);
    coordinator.resetOtpExpiry = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    coordinator.resetOtpVerifiedAt = undefined;

    await sendOtpEmail({
      to: coordinator.email,
      recipientName: coordinator.name || 'Coordinator',
      otp,
      subject: 'Coordinator password reset code',
      purpose: 'reset your password',
    });

    coordinator.resetOtpVerifiedAt = undefined;
    await coordinator.save();

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your registered email address',
    });
  } catch (error: any) {
    console.error('[CoordinatorController] sendCoordinatorResetOtp error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message,
    });
  }
};

// Verify coordinator OTP for password reset
export const verifyCoordinatorResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'coordinator') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Coordinator privileges required.',
      });
      return;
    }

    const { code } = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        message: 'OTP code is required',
      });
      return;
    }

    const coordinator = await Coordinator.findOne({ userId: req.user._id });

    if (!coordinator) {
      res.status(404).json({
        success: false,
        message: 'Coordinator profile not found',
      });
      return;
    }

    if (!coordinator.resetOtp || !coordinator.resetOtpExpiry) {
      res.status(400).json({
        success: false,
        message: 'No OTP request found. Please request a new OTP.',
      });
      return;
    }

    if (new Date(coordinator.resetOtpExpiry).getTime() < Date.now()) {
      coordinator.resetOtp = undefined;
      coordinator.resetOtpExpiry = undefined;
      coordinator.resetOtpVerifiedAt = undefined;
      await coordinator.save();

      res.status(400).json({
        success: false,
        message: 'OTP verification expired. Please request a new OTP.',
      });
      return;
    }

    const isValid = await bcrypt.compare(code, coordinator.resetOtp);

    if (!isValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid OTP code',
      });
      return;
    }

    coordinator.resetOtpVerifiedAt = new Date();
    coordinator.resetOtp = undefined;
    coordinator.resetOtpExpiry = undefined;
    await coordinator.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error: any) {
    console.error('[CoordinatorController] verifyCoordinatorResetOtp error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message,
    });
  }
};

// Reset coordinator password after OTP verification
export const resetCoordinatorPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'coordinator') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Coordinator privileges required.',
      });
      return;
    }

    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Both password fields are required',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
      return;
    }

    const coordinator = await Coordinator.findOne({ userId: req.user._id });

    if (!coordinator || !coordinator.resetOtpVerifiedAt) {
      res.status(400).json({
        success: false,
        message: 'Please verify OTP first',
      });
      return;
    }

    const verificationTime = new Date(coordinator.resetOtpVerifiedAt);
    const now = new Date();
    const timeDiff = now.getTime() - verificationTime.getTime();
    const tenMinutesMs = 10 * 60 * 1000;

    if (timeDiff > tenMinutesMs) {
      coordinator.resetOtpVerifiedAt = undefined;
      await coordinator.save();
      res.status(400).json({
        success: false,
        message: 'OTP verification expired. Please request a new OTP.',
      });
      return;
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    coordinator.resetOtpVerifiedAt = undefined;
    await coordinator.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    console.error('[CoordinatorController] resetCoordinatorPassword error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message,
    });
  }
};

// Get coordinator by ID
export const getCoordinatorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid coordinator ID' });
      return;
    }

    const coordinator = await Coordinator.findOne({ _id: id })
      .populate('userId', 'userId name email role');

    if (!coordinator) {
      res.status(404).json({ success: false, message: 'Coordinator not found' });
      return;
    }

    res.status(200).json({ success: true, coordinator });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update coordinator
export const updateCoordinator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid coordinator ID' });
      return;
    }

    const updatePayload = { ...req.body };
    if (!updatePayload.role && Array.isArray(updatePayload.roles)) {
      updatePayload.role = cleanString(updatePayload.roles[0]);
    }
    delete updatePayload.roles;

    const coordinator = await Coordinator.findByIdAndUpdate(id, updatePayload, {
      returnDocument: 'after',
      runValidators: true,
    }).populate('userId', 'userId name email role');

    if (!coordinator) {
      res.status(404).json({ success: false, message: 'Coordinator not found' });
      return;
    }

    const userUpdate: any = {};
    if (req.body?.name) userUpdate.name = req.body.name;
    if (req.body?.email) userUpdate.email = req.body.email;

    if (Object.keys(userUpdate).length > 0 && coordinator.userId?._id) {
      await User.findByIdAndUpdate(coordinator.userId._id, { $set: userUpdate }, { runValidators: true });
    }

    res.status(200).json({
      success: true,
      message: 'Coordinator updated successfully',
      coordinator,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Hard delete coordinator and associated user
export const deleteCoordinator = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid coordinator ID' });
      return;
    }

    const coordinator = await Coordinator.findById(id);

    if (!coordinator) {
      res.status(404).json({ success: false, message: 'Coordinator not found' });
      return;
    }

    await Coordinator.findByIdAndDelete(id);

    if (coordinator.userId) {
      await User.findByIdAndDelete(coordinator.userId);
    }

    res.status(200).json({
      success: true,
      message: 'Coordinator and associated user account deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting coordinator:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

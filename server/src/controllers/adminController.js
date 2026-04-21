import Alumni from '../models/alumni.js';
import Coordinator from '../models/coordinator.js';
import Event from '../models/event.js';
import Mail from '../models/mail.js';
import MailResponse from '../models/mailResponse.js';
import JobReference from '../models/jobReference.js';
import Payment from '../models/payment.js';
import Admin from '../models/admin.js';
import mongoose from 'mongoose';
import User from '../models/user.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendSmsOtp, verifySmsOtp } from '../utils/messanger.js';

/**
 * Get dashboard statistics for admin panel
 * @route GET /api/admin/dashboard/stats
 * @access Private (Admin only)
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Role check: Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Execute all queries in parallel for performance
    const [
      totalAlumni,
      activeCoordinators,
      upcomingEventsCount,
      totalBroadcasts,
      recentMails,
      acceptedMailResponses,
      activeJobs,
      recentJobsList,
      latestDonation,
      upcomingEvent,
    ] = await Promise.all([
      // 1. Total active alumni
      Alumni.countDocuments({ isActive: true }),

      // 2. Active coordinators (status='Active' AND isActive=true)
      Coordinator.countDocuments({ status: 'Active', isActive: true }),

      // 3. Upcoming events count (pending status and date >= today)
      Event.countDocuments({
        status: 'pending',
        eventDate: { $gte: today },
      }),

      // 4. Total broadcast messages sent
      Mail.countDocuments({ isBroadcast: true }),

      // 5. Recent mails (last 2 for preview)
      Mail.find({})
        .sort({ createdAt: -1 })
        .limit(2)
        .select('title content createdAt'),

      // 6. Count of accepted mail responses
      MailResponse.countDocuments({ action: 'accept' }),

      // 7. Active job references count
      JobReference.countDocuments({ status: 'approved' }),

      // 8. Recent approved jobs (last 2 for preview)
      JobReference.find({ status: 'approved' })
        .sort({ createdAt: -1 })
        .limit(2)
        .select('role companyName submittedBy')
        .populate('submittedBy', 'name'),

      // 9. Latest successful donation/payment
      Payment.findOne({ status: 'paid' })
        .sort({ paidAt: -1 })
        .select('amount purpose paidAt user')
        .populate('user', 'name'),

      // 10. Next upcoming event details
      Event.findOne({
        status: 'pending',
        eventDate: { $gte: today },
      })
        .sort({ eventDate: 1 })
        .select('eventName eventDate eventDay eventTime venue organizer')
        .populate('organizer', 'branch'),
    ]);

    // Calculate days until next event
    let daysUntilEvent = null;
    let hoursUntilEvent = null;
    if (upcomingEvent) {
      const eventDateTime = new Date(upcomingEvent.eventDate);
      const now = new Date();
      const diffMs = eventDateTime - now;
      daysUntilEvent = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      hoursUntilEvent = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    }

    // Format recent mails for display
    const formattedMails = recentMails.map(mail => ({
      title: mail.title,
      preview: mail.content?.substring(0, 80) + (mail.content?.length > 80 ? '...' : ''),
      createdAt: mail.createdAt,
    }));

    // Format recent jobs for display
    const formattedJobs = recentJobsList.map(job => ({
      role: job.role,
      company: job.companyName,
      referredBy: job.submittedBy?.name || 'Unknown',
    }));

    // Format latest donation
    const formattedDonation = latestDonation ? {
      amount: latestDonation.amount,
      purpose: latestDonation.purpose,
      paidAt: latestDonation.paidAt,
      donorName: latestDonation.user?.name || 'Anonymous',
    } : null;

    // Format upcoming event
    const formattedEvent = upcomingEvent ? {
      name: upcomingEvent.eventName,
      date: upcomingEvent.eventDate,
      day: upcomingEvent.eventDay,
      time: upcomingEvent.eventTime,
      venue: upcomingEvent.venue,
      organizer: upcomingEvent.organizer?.branch || 'TBD',
      daysUntil: daysUntilEvent,
      hoursUntil: hoursUntilEvent,
    } : null;

    return res.status(200).json({
      success: true,
      stats: {
        totalAlumni,
        activeCoordinators,
        upcomingEvents: upcomingEventsCount,
        totalBroadcasts,
      },
      cards: {
        mail: {
          newCount: recentMails.length,
          recentMails: formattedMails,
          acceptedCount: acceptedMailResponses,
        },
        jobs: {
          activeCount: activeJobs,
          recentJobs: formattedJobs,
        },
        donation: formattedDonation,
        event: formattedEvent,
      },
    });
  } catch (error) {
    console.error('[AdminController] getDashboardStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
};

/**
 * Get accepted mail responses for admin panel
 * @route GET /api/admin/mail/accepted-responses
 * @access Private (Admin only)
 */
export const getAcceptedMailResponses = async (req, res) => {
  try {
    // Role check: Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { page = 1, limit = 10, mailId } = req.query;
    const skip = (page - 1) * limit;

    // Build query filter
    const filter = { action: 'accept' };
    if (mailId) {
      filter.mailId = mailId;
    }

    // Fetch accepted responses with mail details
    const [responses, totalCount] = await Promise.all([
      MailResponse.find(filter)
        .populate('mailId', 'title content senderName eventDetails createdAt')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      MailResponse.countDocuments(filter),
    ]);

    const formattedResponses = responses.map(response => ({
      id: response._id,
      recipientEmail: response.recipientEmail,
      submittedAt: response.submittedAt,
      mailInfo: {
        id: response.mailId._id,
        title: response.mailId.title,
        senderName: response.mailId.senderName,
        isEventInvitation: !!response.mailId.eventDetails?.eventName,
        eventName: response.mailId.eventDetails?.eventName,
        sentAt: response.mailId.createdAt,
      },
      alumniData: {
        fullName: response.responseData?.fullName,
        designation: response.responseData?.designation,
        companyName: response.responseData?.companyName,
        contactInfo: {
          mobile: response.responseData?.mobileNo,
          personalEmail: response.responseData?.personalEmail,
          officialEmail: response.responseData?.officialEmail,
          location: response.responseData?.location,
        },
        batch: response.responseData?.batchYear,
      },
    }));

    return res.status(200).json({
      success: true,
      data: {
        responses: formattedResponses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page * limit < totalCount,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('[AdminController] getAcceptedMailResponses error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch accepted mail responses',
      error: error.message,
    });
  }
};

/**
 * Get admin profile
 * @route GET /api/admin/profile
 * @access Private (Admin only)
 */
export const getAdminProfile = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const admin = await Admin.findOne({ userId: req.user.id });

    if (!admin) {
      // Return empty profile if not created yet
      return res.status(200).json({
        success: true,
        data: null,
        message: 'Profile not set up yet',
      });
    }

    return res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error('[AdminController] getAdminProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin profile',
      error: error.message,
    });
  }
};

/**
 * Create or Update admin profile
 * @route PUT /api/admin/profile
 * @access Private (Admin only)
 */
export const updateAdminProfile = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const {
      registerNumber,
      name,
      username,
      email,
      mobile,
      dateOfBirth,
      degree,
      branch,
      presentAddress,
      permanentAddress,
      designation,
      profilePhoto,
      instituteDetails,
    } = req.body;

    // Helper to convert empty strings to undefined (for sparse unique indexes)
    const cleanValue = (val) => (val && val.trim() !== '' ? val.trim() : undefined);

    const updateData = {
      registerNumber: cleanValue(registerNumber),
      name: cleanValue(name),
      username: cleanValue(username),
      email: cleanValue(email),
      mobile: cleanValue(mobile),
      dateOfBirth: dateOfBirth || undefined,
      degree: cleanValue(degree),
      branch: cleanValue(branch),
      presentAddress,
      permanentAddress,
      designation: cleanValue(designation),
    };

    // Handle profile photo if provided
    if (profilePhoto !== undefined) {
      updateData.profilePhoto = profilePhoto ? new mongoose.Types.ObjectId(profilePhoto) : null;
    }

    // Handle institute details if provided
    if (instituteDetails) {
      updateData.instituteDetails = {
        logo: instituteDetails.logo ? new mongoose.Types.ObjectId(instituteDetails.logo) : null,
        banner: instituteDetails.banner ? new mongoose.Types.ObjectId(instituteDetails.banner) : null,
      };
    }

    const admin = await Admin.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { ...updateData, userId: req.user.id } },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: admin,
    });
  } catch (error) {
    console.error('[AdminController] updateAdminProfile error:', error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

/**
 * Update admin password
 * @route PUT /api/admin/profile/password
 * @access Private (Admin only)
 */
export const updateAdminPassword = async (req, res) => {
  try {
    console.log('[updateAdminPassword] Request received:', {
      userId: req.user?.id,
      role: req.user?.role,
      bodyKeys: Object.keys(req.body),
      body: req.body
    });

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Fetch user with password field (need it for comparison)
    const userId = req.user._id || req.user.id;
    console.log('[updateAdminPassword] Fetching user:', {
      userId,
      userKeys: Object.keys(req.user)
    });

    const user = await User.findById(userId);
    console.log('[updateAdminPassword] User fetch result:', {
      found: !!user,
      hasPassword: !!user?.password,
      passwordLength: user?.password?.length
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('[updateAdminPassword] Comparing passwords...');
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    console.log('[updateAdminPassword] Password match result:', isMatch);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('[AdminController] updateAdminPassword error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message,
    });
  }
};

/**
 * Send OTP for password reset
 * @route POST /api/admin/profile/send-otp
 * @access Private (Admin only)
 */
export const sendResetOtp = async (req, res) => {
  try {
    console.log('[sendResetOtp] Request received:', {
      bodyKeys: Object.keys(req.body),
      body: req.body,
      userId: req.user?.id,
      role: req.user?.role,
    });

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { mobile } = req.body;

    if (!mobile) {
      console.log('[sendResetOtp] Mobile not provided in request body');
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required',
      });
    }

    const admin = await Admin.findOne({ userId: req.user.id });
    console.log('[sendResetOtp] Admin fetch result:', {
      found: !!admin,
      adminId: admin?._id,
      hasStoredMobile: !!admin?.mobile,
    });

    if (!admin) {
      console.log('[sendResetOtp] Admin profile not found for userId:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Admin profile not found',
      });
    }

    // Verify mobile matches
    console.log('[sendResetOtp] Comparing mobile numbers:', {
      incomingMobile: mobile,
      storedMobile: admin.mobile,
    });

    const cleanMobile = mobile.replace(/\s+/g, '').replace(/^\+91/, '');
    const storedMobile = admin.mobile.replace(/\s+/g, '').replace(/^\+91/, '');

    console.log('[sendResetOtp] After cleanup:', {
      cleanIncoming: cleanMobile,
      cleanStored: storedMobile,
      match: cleanMobile === storedMobile,
    });

    if (cleanMobile !== storedMobile) {
      console.log('[sendResetOtp] Mobile number mismatch');
      return res.status(400).json({
        success: false,
        message: 'Mobile number does not match our records',
      });
    }

    // Convert mobile to E.164 format for Twilio
    const phoneForTwilio = mobile.startsWith('+') ? mobile : `+91${cleanMobile}`;
    console.log('[sendResetOtp] Sending OTP via Twilio to:', phoneForTwilio);

    // Send OTP via Twilio Verify API (Twilio generates and sends the OTP)
    const smsResult = await sendSmsOtp(phoneForTwilio);
    console.log('[sendResetOtp] Twilio result:', smsResult);

    if (!smsResult.success) {
      console.error('[sendResetOtp] Failed to send OTP:', smsResult.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP via SMS: ' + smsResult.message,
      });
    }

    // Store phone number and verification SID for verification step
    admin.resetPhoneNumber = phoneForTwilio;
    admin.twilioVerificationSid = smsResult.verificationSid;
    await admin.save();

    console.log('[sendResetOtp] Verification SID stored:', smsResult.verificationSid);

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your registered mobile number',
    });
  } catch (error) {
    console.error('[AdminController] sendResetOtp error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message,
    });
  }
};

/**
 * Verify OTP for password reset
 * @route POST /api/admin/profile/verify-otp
 * @access Private (Admin only)
 */
export const verifyResetOtp = async (req, res) => {
  try {
    console.log('[verifyResetOtp] Request received:', {
      bodyKeys: Object.keys(req.body),
      code: req.body.code,
    });

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { code } = req.body;

    if (!code) {
      console.log('[verifyResetOtp] OTP code not provided');
      return res.status(400).json({
        success: false,
        message: 'OTP code is required',
      });
    }

    const admin = await Admin.findOne({ userId: req.user.id });
    console.log('[verifyResetOtp] Admin lookup:', {
      found: !!admin,
      hasPhoneNumber: !!admin?.resetPhoneNumber,
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin profile not found',
      });
    }

    if (!admin.resetPhoneNumber) {
      console.log('[verifyResetOtp] No pending OTP verification');
      return res.status(400).json({
        success: false,
        message: 'No OTP request found. Please request a new OTP.',
      });
    }

    console.log('[verifyResetOtp] Verifying with Twilio:', {
      phoneNumber: admin.resetPhoneNumber,
      code,
    });

    // Verify code with Twilio
    const verifyResult = await verifySmsOtp(admin.resetPhoneNumber, code);
    console.log('[verifyResetOtp] Twilio verification result:', verifyResult);

    if (!verifyResult.success) {
      console.log('[verifyResetOtp] OTP verification failed:', verifyResult.message);
      return res.status(400).json({
        success: false,
        message: verifyResult.message,
      });
    }

    // OTP verified - set a flag for password reset step
    admin.resetOtpVerifiedAt = new Date();
    admin.resetPhoneNumber = undefined;
    admin.twilioVerificationSid = undefined;
    await admin.save();

    console.log('[verifyResetOtp] OTP verified successfully');

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('[AdminController] verifyResetOtp error:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message,
    });
  }
};

/**
 * Reset password after OTP verification
 * @route POST /api/admin/profile/reset-password
 * @access Private (Admin only)
 */
export const resetPassword = async (req, res) => {
  try {
    console.log('[resetPassword] Request received:', {
      userId: req.user?.id,
      role: req.user?.role,
      bodyKeys: Object.keys(req.body),
    });

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both password fields are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const admin = await Admin.findOne({ userId: req.user.id });
    if (!admin || !admin.resetOtpVerifiedAt) {
      return res.status(400).json({
        success: false,
        message: 'Please verify OTP first',
      });
    }

    // Check if OTP verification is still valid (within 10 minutes)
    const verificationTime = new Date(admin.resetOtpVerifiedAt);
    const now = new Date();
    const timeDiff = now - verificationTime;
    const tenMinutesMs = 10 * 60 * 1000;

    if (timeDiff > tenMinutesMs) {
      admin.resetOtpVerifiedAt = undefined;
      await admin.save();
      return res.status(400).json({
        success: false,
        message: 'OTP verification expired. Please request a new OTP.',
      });
    }

    const user = await User.findById(req.user.id);
    console.log('[resetPassword] User lookup:', {
      found: !!user,
      userId: req.user.id,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('[resetPassword] Hashing new password');
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    console.log('[resetPassword] Password updated successfully');

    // Clear OTP verification state
    admin.resetOtpVerifiedAt = undefined;
    await admin.save();

    console.log('[resetPassword] OTP state cleared');

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('[AdminController] resetPassword error:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message,
    });
  }
};

/**
 * Get institute branding (logo and banner) - PUBLIC endpoint
 * @route GET /api/admin/branding
 * @access Public
 */
export const getInstituteBranding = async (req, res) => {
  try {
    // Find any admin with institute details set
    const admin = await Admin.findOne({
      $or: [
        { 'instituteDetails.logo': { $ne: null } },
        { 'instituteDetails.banner': { $ne: null } },
      ],
    }).select('instituteDetails');

    if (!admin || !admin.instituteDetails) {
      return res.status(200).json({
        success: true,
        data: {
          logo: null,
          banner: null,
          name: null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        logo: admin.instituteDetails.logo
          ? `/api/images/${admin.instituteDetails.logo}`
          : null,
        banner: admin.instituteDetails.banner
          ? `/api/images/${admin.instituteDetails.banner}`
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch institute branding',
    });
  }
};


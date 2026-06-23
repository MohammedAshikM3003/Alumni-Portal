import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import Alumni from '../models/alumni.js';
import Coordinator from '../models/coordinator.js';
import Event from '../models/event.js';
import Mail from '../models/mail.js';
import MailResponse from '../models/mailResponse.js';
import JobReference from '../models/jobReference.js';
import Payment from '../models/payment.js';
import Admin from '../models/admin.js';
import User from '../models/user.js';
import { generateOtp, sendOtpEmail, OTP_TTL_MINUTES } from '../utils/emailOtp.js';
import { io } from '../server.js';

/**
 * Get dashboard statistics for admin panel
 * @route GET /api/admin/dashboard/stats
 * @access Private (Admin only)
 */
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Role check: Admin only
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
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
      Alumni.countDocuments({}),
      Coordinator.countDocuments({ status: 'Active' }),
      Event.countDocuments({
        status: 'pending',
        eventDate: { $gte: today },
      }),
      Mail.countDocuments({ isBroadcast: true }),
      Mail.find({})
        .sort({ createdAt: -1 })
        .limit(2)
        .select('title content createdAt'),
      MailResponse.countDocuments({ action: 'accept' }),
      JobReference.countDocuments({ status: 'approved' }),
      JobReference.find({ status: 'approved' })
        .sort({ createdAt: -1 })
        .limit(2)
        .select('role companyName submittedBy')
        .populate<{ submittedBy: { name: string } }>('submittedBy', 'name'),
      Payment.findOne({ status: 'paid' })
        .sort({ paidAt: -1 })
        .select('amount purpose paidAt user')
        .populate<{ user: { name: string } }>('user', 'name'),
      Event.findOne({
        status: 'pending',
        eventDate: { $gte: today },
      })
        .sort({ eventDate: 1 })
        .select('eventName eventDate eventDay eventTime venue organizer')
        .populate<{ organizer: { branch: string } }>('organizer', 'branch'),
    ]);

    // Calculate days until next event
    let daysUntilEvent: number | null = null;
    let hoursUntilEvent: number | null = null;
    if (upcomingEvent && upcomingEvent.eventDate) {
      const eventDateTime = new Date(upcomingEvent.eventDate);
      const now = new Date();
      const diffMs = eventDateTime.getTime() - now.getTime();
      daysUntilEvent = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      hoursUntilEvent = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    }

    // Format recent mails for display
    const formattedMails = recentMails.map(mail => ({
      title: mail.title,
      preview: mail.content?.substring(0, 80) + ((mail.content?.length || 0) > 80 ? '...' : ''),
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

    res.status(200).json({
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
  } catch (error: any) {
    console.error('[AdminController] getDashboardStats error:', error);
    res.status(500).json({
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
export const getAcceptedMailResponses = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const mailId = req.query.mailId as string;
    const skip = (page - 1) * limit;

    const filter: any = { action: 'accept' };
    if (mailId) {
      filter.mailId = mailId;
    }

    const [responses, totalCount] = await Promise.all([
      MailResponse.find(filter)
        .populate('mailId', 'title content senderName eventDetails createdAt')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit),
      MailResponse.countDocuments(filter),
    ]);

    const formattedResponses = responses.map(response => {
      const mail: any = response.mailId;
      return {
        id: response._id,
        recipientEmail: response.recipientEmail,
        submittedAt: response.submittedAt,
        mailInfo: {
          id: mail?._id,
          title: mail?.title,
          senderName: mail?.senderName,
          isEventInvitation: !!mail?.eventDetails?.eventName,
          eventName: mail?.eventDetails?.eventName,
          sentAt: mail?.createdAt,
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
      };
    });

    res.status(200).json({
      success: true,
      data: {
        responses: formattedResponses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page * limit < totalCount,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error: any) {
    console.error('[AdminController] getAcceptedMailResponses error:', error);
    res.status(500).json({
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
export const getAdminProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    const admin = await Admin.findOne({ userId: req.user._id });

    if (!admin) {
      res.status(200).json({
        success: true,
        data: null,
        message: 'Profile not set up yet',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error: any) {
    console.error('[AdminController] getAdminProfile error:', error);
    res.status(500).json({
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
export const updateAdminProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
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

    const cleanValue = (val: any) => (val && typeof val === 'string' && val.trim() !== '' ? val.trim() : undefined);

    const updateData: any = {
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

    if (profilePhoto !== undefined) {
      updateData.profilePhoto = profilePhoto ? new mongoose.Types.ObjectId(profilePhoto) : null;
    }

    if (instituteDetails) {
      updateData.instituteDetails = {
        logo: instituteDetails.logo ? new mongoose.Types.ObjectId(instituteDetails.logo) : null,
        banner: instituteDetails.banner ? new mongoose.Types.ObjectId(instituteDetails.banner) : null,
      };
    }

    const admin = await Admin.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { ...updateData, userId: req.user._id } },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    if (admin && instituteDetails && (instituteDetails.logo !== undefined || instituteDetails.banner !== undefined)) {
      const brandingData = {
        logo: admin.instituteDetails?.logo ? `/api/images/${admin.instituteDetails.logo}` : null,
        banner: admin.instituteDetails?.banner ? `/api/images/${admin.instituteDetails.banner}` : null,
      };

      io.emit('admin-branding-updated', {
        success: true,
        data: brandingData,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: admin,
    });
  } catch (error: any) {
    console.error('[AdminController] updateAdminProfile error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
      return;
    }

    res.status(500).json({
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
export const updateAdminPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
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
    console.error('[AdminController] updateAdminPassword error:', error);
    res.status(500).json({
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
export const sendResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
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

    const admin = await Admin.findOne({ userId: req.user._id });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin profile not found',
      });
      return;
    }

    if (!admin.mobile) {
      res.status(400).json({
        success: false,
        message: 'Admin profile has no mobile number',
      });
      return;
    }

    const cleanMobile = mobile.replace(/\s+/g, '').replace(/^\+91/, '');
    const storedMobile = admin.mobile.replace(/\s+/g, '').replace(/^\+91/, '');

    if (cleanMobile !== storedMobile) {
      res.status(400).json({
        success: false,
        message: 'Mobile number does not match our records',
      });
      return;
    }

    if (!admin.email) {
      res.status(400).json({
        success: false,
        message: 'Admin profile has no email address',
      });
      return;
    }

    const otp = generateOtp();
    admin.resetOtp = await bcrypt.hash(otp, 10);
    admin.resetOtpExpiry = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    admin.resetOtpVerifiedAt = undefined;

    await sendOtpEmail({
      to: admin.email,
      recipientName: admin.name || 'Admin',
      otp,
      subject: 'Admin password reset code',
      purpose: 'reset your password',
    });

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your registered email address',
    });
  } catch (error: any) {
    console.error('[AdminController] sendResetOtp error:', error);
    res.status(500).json({
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
export const verifyResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
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

    const admin = await Admin.findOne({ userId: req.user._id });

    if (!admin) {
      res.status(404).json({
        success: false,
        message: 'Admin profile not found',
      });
      return;
    }

    if (!admin.resetOtp || !admin.resetOtpExpiry) {
      res.status(400).json({
        success: false,
        message: 'No OTP request found. Please request a new OTP.',
      });
      return;
    }

    if (new Date(admin.resetOtpExpiry).getTime() < Date.now()) {
      admin.resetOtp = undefined;
      admin.resetOtpExpiry = undefined;
      admin.resetOtpVerifiedAt = undefined;
      await admin.save();

      res.status(400).json({
        success: false,
        message: 'OTP verification expired. Please request a new OTP.',
      });
      return;
    }

    const isValid = await bcrypt.compare(code, admin.resetOtp);

    if (!isValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid OTP code',
      });
      return;
    }

    admin.resetOtpVerifiedAt = new Date();
    admin.resetOtp = undefined;
    admin.resetOtpExpiry = undefined;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error: any) {
    console.error('[AdminController] verifyResetOtp error:', error);
    res.status(500).json({
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
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
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

    const admin = await Admin.findOne({ userId: req.user._id });
    if (!admin || !admin.resetOtpVerifiedAt) {
      res.status(400).json({
        success: false,
        message: 'Please verify OTP first',
      });
      return;
    }

    const verificationTime = new Date(admin.resetOtpVerifiedAt);
    const now = new Date();
    const timeDiff = now.getTime() - verificationTime.getTime();
    const tenMinutesMs = 10 * 60 * 1000;

    if (timeDiff > tenMinutesMs) {
      admin.resetOtpVerifiedAt = undefined;
      await admin.save();
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

    admin.resetOtpVerifiedAt = undefined;
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    console.error('[AdminController] resetPassword error:', error);
    res.status(500).json({
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
export const getInstituteBranding = async (req: Request, res: Response): Promise<void> => {
  try {
    const admin = await Admin.findOne({
      $or: [
        { 'instituteDetails.logo': { $ne: null } },
        { 'instituteDetails.banner': { $ne: null } },
      ],
    }).select('instituteDetails');

    if (!admin || !admin.instituteDetails) {
      res.status(200).json({
        success: true,
        data: {
          logo: null,
          banner: null,
          name: null,
        },
      });
      return;
    }

    res.status(200).json({
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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch institute branding',
    });
  }
};

import crypto from 'crypto';
import mongoose from 'mongoose';
import MailToken from '../models/mailToken.js';
import MailResponse from '../models/mailResponse.js';
import Mail from '../models/mail.js';
import User from '../models/user.js';
import Alumni from '../models/alumni.js';
import { hashPassword } from '../security/bycrypt.js';
import { generateToken } from '../security/jwt.js';
import { sendAdminNotification } from './mailController.js';

/**
 * Helper function to create or find alumni user and return auth data
 */
async function createOrFindAlumniUser(email, responseData = {}) {
  try {
    // Check if user already exists by email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // User exists, generate JWT and return their data
      const token = generateToken({ id: user._id, role: user.role });

      return {
        token,
        user: {
          id: user._id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role
        }
      };
    }

    // Generate a temporary register number (11 digits)
    // Use timestamp + random to ensure uniqueness
    const tempRegNum = Date.now().toString().slice(-11);

    // Generate a random password (they can reset it later)
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await hashPassword(randomPassword);

    // Create new User
    user = await User.create({
      userId: tempRegNum,
      name: responseData.fullName || email.split('@')[0],
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'alumni'
    });

    // Create minimal Alumni record
    const alumniData = {
      userId: user._id,
      registerNumber: tempRegNum,
      name: responseData.fullName || email.split('@')[0],
      email: email.toLowerCase(),
      dob: new Date('2000-01-01'), // Default DOB
      yearFrom: responseData.batchYear?.startYear || 2020,
      yearTo: responseData.batchYear?.endYear || 2024,
      degree: 'Pending', // They can update later
      branch: 'Pending',
      designation: responseData.designation || '',
      presentAddress: {
        city: responseData.location || '',
        mobile: responseData.mobileNo || ''
      }
    };

    await Alumni.create(alumniData);

    console.log(`✅ Created new alumni user: ${email}`);

    // Generate JWT token for the new user
    const token = generateToken({ id: user._id, role: user.role });

    return {
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Error creating/finding alumni user:', error);
    throw error;
  }
}

/**
 * Generate secure tokens for a mail and its recipients
 * Creates ONE token per recipient (works for both accept and reject)
 * @param {string} mailId - The mail document ID
 * @param {string[]} recipientEmails - Array of recipient emails
 * @returns {Object[]} Array of token objects with email and token
 */
export const generateTokensForMail = async (mailId, recipientEmails) => {
  try {
    const tokens = [];
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    for (const email of recipientEmails) {
      // Create ONE token per recipient (handles both accept and reject)
      const token = crypto.randomBytes(32).toString('hex');

      await MailToken.create({
        token,
        mailId,
        recipientEmail: email,
        isTokenValid: true,
        expiresAt
      });

      tokens.push({
        email,
        token
      });
    }

    console.log(`✅ Generated ${recipientEmails.length} token(s) for recipients`);
    return tokens;
  } catch (error) {
    console.error('❌ Error generating tokens:', error);
    throw new Error('Failed to generate tokens');
  }
};

/**
 * Validate a token without consuming it
 * GET /api/tokens/validate/:token
 */
export const validateToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const tokenRecord = await MailToken.findValidToken(token);

    if (!tokenRecord) {
      return res.status(404).json({
        success: false,
        message: 'Invalid, expired, or already used token'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Token is valid',
      tokenInfo: {
        recipientEmail: tokenRecord.recipientEmail,
        mailId: tokenRecord.mailId._id,
        mailTitle: tokenRecord.mailId.title,
        mailContent: tokenRecord.mailId.content,
        expiresAt: tokenRecord.expiresAt
      }
    });

  } catch (error) {
    console.error('Error validating token:', error);
    return res.status(500).json({
      success: false,
      message: 'Token validation failed'
    });
  }
};

/**
 * Get token information without consuming it
 * GET /api/tokens/info/:token
 */
export const getTokenInfo = async (req, res) => {
  try {
    const { token } = req.params;

    const tokenRecord = await MailToken.findValidToken(token);

    if (!tokenRecord) {
      return res.status(404).json({
        success: false,
        message: 'Invalid, expired, or already used token'
      });
    }

    return res.status(200).json({
      success: true,
      tokenInfo: {
        recipientEmail: tokenRecord.recipientEmail,
        mail: {
          id: tokenRecord.mailId._id,
          title: tokenRecord.mailId.title,
          content: tokenRecord.mailId.content,
          senderName: tokenRecord.mailId.senderName,
          senderEmail: tokenRecord.mailId.senderEmail
        },
        expiresAt: tokenRecord.expiresAt,
        createdAt: tokenRecord.createdAt
      }
    });

  } catch (error) {
    console.error('Error getting token info:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get token information'
    });
  }
};

/**
 * Submit form response using token
 * POST /api/tokens/:token/submit
 */
export const submitTokenResponse = async (req, res) => {
  try {
    const { token } = req.params;
    const { action, responseData } = req.body;

    // Validate action
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be accept or reject'
      });
    }

    // Validate token
    const tokenRecord = await MailToken.findValidToken(token);

    if (!tokenRecord) {
      return res.status(404).json({
        success: false,
        message: 'Invalid, expired, or already used token'
      });
    }

    // Get client info for audit trail
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Create response record
    const mailResponse = await MailResponse.createResponse({
      mailId: tokenRecord.mailId._id,
      tokenId: tokenRecord._id,
      recipientEmail: tokenRecord.recipientEmail,
      action,
      responseData,
      userAgent,
      ipAddress
    });

    // Mark token as used
    await tokenRecord.markAsUsed(userAgent, ipAddress);

    console.log(`✅ Response submitted for token: ${token.substring(0, 8)}...`);

    // Send admin notification email
    try {
        const mail = tokenRecord.mailId; // Already populated from findValidToken
        const notificationData = {
            ...responseData,
            recipientEmail: tokenRecord.recipientEmail
        };

        await sendAdminNotification(notificationData, mail, action);
        console.log(`📧 Admin notification sent for ${action} response`);
    } catch (notificationError) {
        console.error('⚠️ Warning: Admin notification failed:', notificationError.message);
        // Continue execution - response was still recorded
    }

    // Create or find alumni user and get auth data
    let userData = null;
    try {
      const email = responseData.personalEmail || tokenRecord.recipientEmail;
      userData = await createOrFindAlumniUser(email, responseData);
    } catch (error) {
      console.error('Warning: Could not create user session:', error.message);
      // Continue even if user creation fails - response was recorded
    }

    return res.status(201).json({
      success: true,
      message: `Response ${action}ed successfully`,
      responseId: mailResponse._id,
      submittedAt: mailResponse.submittedAt,
      token: userData?.token, // JWT token for API authentication
      user: userData?.user   // User data for frontend
    });

  } catch (error) {
    console.error('Error submitting token response:', error);

    if (error.message.includes('Missing required fields')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to submit response'
    });
  }
};

/**
 * Simple reject response using token
 * POST /api/tokens/:token/reject
 */
export const rejectTokenResponse = async (req, res) => {
  try {
    const { token } = req.params;
    const { rejectionReason } = req.body;

    // Validate token
    const tokenRecord = await MailToken.findValidToken(token);

    if (!tokenRecord) {
      return res.status(404).json({
        success: false,
        message: 'Invalid, expired, or already used token'
      });
    }

    // Get client info
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Create rejection response
    const responseData = rejectionReason ? { rejectionReason } : {};

    const mailResponse = await MailResponse.create({
      mailId: tokenRecord.mailId._id,
      tokenId: tokenRecord._id,
      recipientEmail: tokenRecord.recipientEmail,
      action: 'reject',
      responseData,
      userAgent,
      ipAddress
    });

    // Mark token as used
    await tokenRecord.markAsUsed(userAgent, ipAddress);

    // Send admin notification email
    try {
        const mail = tokenRecord.mailId; // Already populated from findValidToken
        const notificationData = {
            rejectionReason,
            recipientEmail: tokenRecord.recipientEmail
        };

        await sendAdminNotification(notificationData, mail, 'reject');
        console.log(`📧 Admin notification sent for rejection response`);
    } catch (notificationError) {
        console.error('⚠️ Warning: Admin notification failed:', notificationError.message);
        // Continue execution - response was still recorded
    }

    return res.status(201).json({
      success: true,
      message: 'Invitation rejected successfully',
      responseId: mailResponse._id
    });

  } catch (error) {
    console.error('Error rejecting token response:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject invitation'
    });
  }
};

/**
 * Get statistics for a mail (admin only)
 * GET /api/tokens/mail/:mailId/stats
 */
export const getMailTokenStats = async (req, res) => {
  try {
    const { mailId } = req.params;

    // Get basic mail info
    const mail = await Mail.findById(mailId);

    if (!mail) {
      return res.status(404).json({
        success: false,
        message: 'Mail not found'
      });
    }

    // Get token stats
    const tokenStats = await MailToken.aggregate([
      {
        $match: {
          mailId: new mongoose.Types.ObjectId(mailId)
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          used: { $sum: { $cond: [{ $eq: ['$isTokenValid', false] }, 1, 0] } },
          valid: { $sum: { $cond: ['$isTokenValid', 1, 0] } }
        }
      }
    ]);

    // Get response stats
    const responseStats = await MailResponse.getMailStats(mailId);

    // Format the results
    const stats = {
      mail: {
        id: mail._id,
        title: mail.title,
        recipientCount: mail.recipientCount,
        sentAt: mail.createdAt
      },
      tokens: tokenStats[0] || { total: 0, used: 0, valid: 0 },
      responses: responseStats
    };

    return res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error getting mail token stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get token statistics'
    });
  }
};

/**
 * Get all responses for a mail (admin only)
 * GET /api/tokens/mail/:mailId/responses
 */
export const getMailResponses = async (req, res) => {
  try {
    const { mailId } = req.params;

    const responses = await MailResponse.getResponsesForMail(mailId);

    const formattedResponses = responses.map(response => response.getFormattedResponse());

    return res.status(200).json({
      success: true,
      responses: formattedResponses,
      total: formattedResponses.length
    });

  } catch (error) {
    console.error('Error getting mail responses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get mail responses'
    });
  }
};
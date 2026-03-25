import nodemailer from 'nodemailer';
import Mail from '../models/mail.js';
import { generateTokensForMail } from './tokenController.js';

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Create a transporter using Gmail SMTP
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
        }
    });
};

/**
 * Send mail to specific alumni and save to mails collection
 * POST /api/mail/send-mail
 */
export const sendMail = async (req, res) => {
    try {
        const {
            senderId,
            senderName,
            senderEmail,
            adminName,
            collegeName,
            email,
            emails, // Array of emails for broadcast
            title,
            message,
            isBroadcast
        } = req.body;

        // Determine recipient emails
        const recipientEmails = isBroadcast && emails ? emails : [email];

        // Validate input
        if (!adminName || !collegeName || !message || recipientEmails.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing'
            });
        }

        // Validate email formats
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = recipientEmails.filter(e => !emailRegex.test(e));
        if (invalidEmails.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid email format: ${invalidEmails.join(', ')}`
            });
        }

        // Create transporter
        const transporter = createTransporter();

        const safeAdminName = escapeHtml(adminName);
        const safeCollegeName = escapeHtml(collegeName);
        const safeMessage = escapeHtml(message);
        const portalBaseUrl = process.env.PORTAL_BASE_URL || 'http://localhost:3000'; // Frontend URL for token links

        let emailsSentCount = 0;
        const failedEmails = [];

        // Create and save mail record first to get mailId for token generation
        const mailRecord = new Mail({
            senderId: senderId || 'admin',
            senderName: senderName || adminName,
            senderEmail: senderEmail || process.env.EMAIL_USER,
            title: title || `Message from ${collegeName}`,
            content: message,
            recipientCount: 0, // Will be updated after successful sends
            recipientEmails: [],
            isBroadcast: isBroadcast || false,
        });

        const savedMail = await mailRecord.save();
        console.log(`📧 Mail record created with ID: ${savedMail._id}`);

        // Generate tokens for all recipients
        let tokens;
        try {
            tokens = await generateTokensForMail(savedMail._id, recipientEmails);
            console.log(`🔑 Tokens generated for ${tokens.length} recipients`);
        } catch (tokenError) {
            console.error('❌ Failed to generate tokens:', tokenError.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to generate secure tokens for mail'
            });
        }

        // Send email to each recipient with their unique token
        for (const tokenData of tokens) {
            try {
                const { email: recipientEmail, token } = tokenData;

                // Single token, two different paths for accept/reject
                const acceptUrl = `${portalBaseUrl}/mail/token/${token}/accept`;
                const rejectUrl = `${portalBaseUrl}/mail/token/${token}/reject`;

                const mailOptions = {
                    from: `Alumni Portal <${process.env.EMAIL_USER}>`,
                    to: recipientEmail,
                    subject: title || `Message from ${collegeName} - Alumni Portal`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; background-color: #f7f9fc;">
                            <div style="background: #ffffff; border: 1px solid #e5e9f2; border-radius: 10px; padding: 22px;">
                                <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #1f2937;">${escapeHtml(title || 'New Message')}</h2>

                                <div style="margin-bottom: 12px;">
                                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Admin Name</div>
                                    <div style="font-size: 15px; color: #111827; font-weight: 600;">${safeAdminName}</div>
                                </div>

                                <div style="margin-bottom: 12px;">
                                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">College Name</div>
                                    <div style="font-size: 15px; color: #111827; font-weight: 600;">${safeCollegeName}</div>
                                </div>

                                <div style="margin-bottom: 18px;">
                                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Message Content</div>
                                    <div style="font-size: 15px; color: #111827; line-height: 1.6; white-space: pre-wrap; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">${safeMessage}</div>
                                </div>

                                <div style="display: flex; gap: 10px;">
                                    <a href="${acceptUrl}" style="display: inline-block; text-decoration: none; background: #16a34a; color: #ffffff; font-weight: 600; padding: 10px 16px; border-radius: 8px; margin-right: 10px;">Accept</a>
                                    <a href="${rejectUrl}" style="display: inline-block; text-decoration: none; background: #dc2626; color: #ffffff; font-weight: 600; padding: 10px 16px; border-radius: 8px;">Reject</a>
                                </div>
                            </div>
                        </div>
                    `
                };

                await transporter.sendMail(mailOptions);
                emailsSentCount++;
                console.log(`✅ Email sent to: ${recipientEmail}`);
            } catch (emailError) {
                console.error(`❌ Failed to send to ${tokenData.email}:`, emailError.message);
                failedEmails.push(tokenData.email);
            }
        }

        // Update mail record with final counts
        savedMail.recipientCount = emailsSentCount;
        savedMail.recipientEmails = recipientEmails.filter(e => !failedEmails.includes(e));
        savedMail.hasTokens = true;
        savedMail.tokenGeneratedAt = new Date();
        await savedMail.save();

        console.log(`📧 Mail record updated with ${emailsSentCount} successful recipients`);

        if (failedEmails.length > 0 && emailsSentCount > 0) {
            return res.status(200).json({
                success: true,
                message: `Email sent to ${emailsSentCount} recipient(s). Failed: ${failedEmails.length}`,
                emailsSent: emailsSentCount,
                failedEmails
            });
        }

        if (emailsSentCount === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send any emails',
                failedEmails
            });
        }

        return res.status(200).json({
            success: true,
            message: `Email sent successfully to ${emailsSentCount} recipient(s)`,
            emailsSent: emailsSentCount
        });

    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send email. Please try again later.',
            error: error.message
        });
    }
};

/**
 * Get all sent mails for admin
 * GET /api/mail/sent/:senderId
 */
export const getSentMails = async (req, res) => {
    try {
        // Fetch ALL mails from the collection (admin sees all sent mails)
        const mails = await Mail.find({})
            .sort({ createdAt: -1 })
            .select('senderId senderName senderEmail title content recipientCount isBroadcast createdAt recipientEmails');

        // Import MailResponse model
        const { default: MailResponse } = await import('../models/mailResponse.js');

        // For each mail, get response statistics
        const mailsWithStats = await Promise.all(mails.map(async (mail) => {
            const responses = await MailResponse.find({ mailId: mail._id });

            const stats = {
                total: responses.length,
                accepted: responses.filter(r => r.action === 'accept').length,
                rejected: responses.filter(r => r.action === 'reject').length,
                pending: mail.recipientCount - responses.length
            };

            // Determine dominant status for UI coloring
            let dominantStatus = 'pending';
            if (stats.total > 0) {
                if (stats.accepted > stats.rejected && stats.accepted > stats.pending) {
                    dominantStatus = 'accept';
                } else if (stats.rejected > stats.accepted && stats.rejected > stats.pending) {
                    dominantStatus = 'reject';
                }
            }

            return {
                ...mail.toObject(),
                responseStats: stats,
                dominantStatus: dominantStatus
            };
        }));

        return res.status(200).json({
            success: true,
            mails: mailsWithStats,
            total: mailsWithStats.length
        });

    } catch (error) {
        console.error('Error fetching sent mails:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sent mails',
            error: error.message
        });
    }
};

/**
 * Get all responses for a specific mail (admin view)
 * GET /api/mail/:mailId/responses
 */
export const getMailResponses = async (req, res) => {
    try {
        const { mailId } = req.params;

        const mail = await Mail.findById(mailId);
        if (!mail) {
            return res.status(404).json({
                success: false,
                message: 'Mail not found'
            });
        }

        // Import MailResponse model
        const { default: MailResponse } = await import('../models/mailResponse.js');

        const responses = await MailResponse.find({ mailId })
            .sort({ submittedAt: -1 })
            .select('recipientEmail action responseData submittedAt');

        // Calculate stats
        const stats = {
            total: responses.length,
            accepted: responses.filter(r => r.action === 'accept').length,
            rejected: responses.filter(r => r.action === 'reject').length,
            pending: mail.recipientCount - responses.length
        };

        return res.status(200).json({
            success: true,
            mail,
            responses,
            stats,
            totalRecipients: mail.recipientCount
        });

    } catch (error) {
        console.error('Error fetching mail responses:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch mail responses',
            error: error.message
        });
    }
};
export const getMailById = async (req, res) => {
    try {
        const { mailId } = req.params;

        const mail = await Mail.findById(mailId);

        if (!mail) {
            return res.status(404).json({
                success: false,
                message: 'Mail not found'
            });
        }

        return res.status(200).json({
            success: true,
            mail
        });

    } catch (error) {
        console.error('Error fetching mail:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch mail',
            error: error.message
        });
    }
};

/**
 * Get all sent mails for coordinators (filtered by department)
 * GET /api/mail/department/:department
 */
export const getDepartmentMails = async (req, res) => {
    try {
        const { department } = req.params;

        if (!department) {
            return res.status(400).json({
                success: false,
                message: 'Department parameter is required'
            });
        }

        // For coordinators, show all mails (they can see system-wide communications)
        // In future, this can be enhanced to filter based on specific department rules
        const mails = await Mail.find({})
            .sort({ createdAt: -1 })
            .select('senderId senderName senderEmail title content recipientCount isBroadcast createdAt recipientEmails');

        // Import MailResponse and Alumni models
        const { default: MailResponse } = await import('../models/mailResponse.js');
        const { default: Alumni } = await import('../models/alumni.js');

        // For each mail, get response statistics filtered by coordinator's department
        const mailsWithStats = await Promise.all(mails.map(async (mail) => {
            // Get all responses for this mail
            const allResponses = await MailResponse.find({ mailId: mail._id });

            // Filter responses to only include alumni from coordinator's department
            const departmentResponses = [];

            for (const response of allResponses) {
                try {
                    const alumni = await Alumni.findOne({ email: response.recipientEmail.toLowerCase() });
                    if (alumni && alumni.branch === department) {
                        departmentResponses.push(response);
                    }
                } catch (err) {
                    // Skip if alumni record not found
                    continue;
                }
            }

            // Count department alumni who received this mail
            let departmentRecipientCount = 0;
            for (const email of mail.recipientEmails || []) {
                try {
                    const alumni = await Alumni.findOne({ email: email.toLowerCase() });
                    if (alumni && alumni.branch === department) {
                        departmentRecipientCount++;
                    }
                } catch {
                    // Skip if alumni record not found
                }
            }

            // Calculate department-specific stats
            const stats = {
                total: departmentResponses.length,
                accepted: departmentResponses.filter(r => r.action === 'accept').length,
                rejected: departmentResponses.filter(r => r.action === 'reject').length,
                pending: departmentRecipientCount - departmentResponses.length
            };

            // Determine dominant status based on department alumni responses only
            let dominantStatus = 'pending';
            if (stats.total > 0) {
                if (stats.accepted > stats.rejected && stats.accepted > stats.pending) {
                    dominantStatus = 'accept';
                } else if (stats.rejected > stats.accepted && stats.rejected > stats.pending) {
                    dominantStatus = 'reject';
                }
            }

            return {
                ...mail.toObject(),
                responseStats: stats,
                dominantStatus: dominantStatus,
                departmentRecipientCount: departmentRecipientCount // Add this for reference
            };
        }));

        return res.status(200).json({
            success: true,
            mails: mailsWithStats,
            total: mailsWithStats.length,
            department,
            message: `Showing mail statistics for ${department} department only`
        });

    } catch (error) {
        console.error('Error fetching department mails:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch department mails',
            error: error.message
        });
    }
};

/**
 * Send notification email to admin when alumni responds to invitation
 * @param {Object} responseData - Response data from alumni
 * @param {Object} mailData - Original mail data
 * @param {string} action - 'accept' or 'reject'
 */
export const sendAdminNotification = async (responseData, mailData, action) => {
    try {
        const transporter = createTransporter();

        // Admin email (use sender email from original mail)
        const adminEmail = mailData.senderEmail;

        let emailSubject, emailContent;

        if (action === 'accept') {
            emailSubject = `✅ Acceptance Response Received - ${mailData.title}`;

            const safeFullName = escapeHtml(responseData.fullName || 'N/A');
            const safeDesignation = escapeHtml(responseData.designation || 'N/A');
            const safeCompanyName = escapeHtml(responseData.companyName || 'N/A');
            const safeMobileNo = escapeHtml(responseData.mobileNo || 'N/A');
            const safePersonalEmail = escapeHtml(responseData.personalEmail || 'N/A');
            const safeOfficialEmail = escapeHtml(responseData.officialEmail || 'N/A');
            const safeLocation = escapeHtml(responseData.location || 'N/A');
            const safeBatchYears = responseData.batchYear ?
                `${responseData.batchYear.startYear || 'N/A'} - ${responseData.batchYear.endYear || 'N/A'}` : 'N/A';

            emailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 720px; margin: 0 auto; padding: 20px; background-color: #f7f9fc;">
                    <div style="background: #ffffff; border: 1px solid #e5e9f2; border-radius: 10px; padding: 22px;">
                        <div style="background: #16a34a; color: white; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
                            <h2 style="margin: 0; font-size: 18px;">✅ New Acceptance Response Received</h2>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">Event Details:</h3>
                            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
                                <div style="font-weight: 600; color: #111827;">${escapeHtml(mailData.title)}</div>
                                <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Sent by: ${escapeHtml(mailData.senderName)}</div>
                            </div>
                        </div>

                        <h3 style="margin: 20px 0 12px 0; color: #1f2937; font-size: 16px;">Alumni Details:</h3>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                            <div>
                                <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">PERSONAL INFORMATION</div>
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
                                    <div style="margin-bottom: 8px;"><span style="font-weight: 600; color: #475569;">Full Name:</span> ${safeFullName}</div>
                                    <div style="margin-bottom: 8px;"><span style="font-weight: 600; color: #475569;">Mobile:</span> ${safeMobileNo}</div>
                                    <div style="margin-bottom: 8px;"><span style="font-weight: 600; color: #475569;">Personal Email:</span> ${safePersonalEmail}</div>
                                    <div><span style="font-weight: 600; color: #475569;">Location:</span> ${safeLocation}</div>
                                </div>
                            </div>

                            <div>
                                <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">PROFESSIONAL INFORMATION</div>
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
                                    <div style="margin-bottom: 8px;"><span style="font-weight: 600; color: #475569;">Designation:</span> ${safeDesignation}</div>
                                    <div style="margin-bottom: 8px;"><span style="font-weight: 600; color: #475569;">Company:</span> ${safeCompanyName}</div>
                                    <div style="margin-bottom: 8px;"><span style="font-weight: 600; color: #475569;">Official Email:</span> ${safeOfficialEmail}</div>
                                    <div><span style="font-weight: 600; color: #475569;">Batch Years:</span> ${safeBatchYears}</div>
                                </div>
                            </div>
                        </div>

                        <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 12px; margin-top: 16px;">
                            <div style="font-size: 14px; color: #166534; font-weight: 600;">✓ This alumni has accepted the invitation and provided their updated information.</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (action === 'reject') {
            emailSubject = `❌ Rejection Response Received - ${mailData.title}`;

            const safeRejectionReason = escapeHtml(responseData.rejectionReason || 'No reason provided');
            const recipientEmail = escapeHtml(responseData.recipientEmail || 'Unknown');

            emailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; background-color: #f7f9fc;">
                    <div style="background: #ffffff; border: 1px solid #e5e9f2; border-radius: 10px; padding: 22px;">
                        <div style="background: #dc2626; color: white; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
                            <h2 style="margin: 0; font-size: 18px;">❌ New Rejection Response Received</h2>
                        </div>

                        <div style="margin-bottom: 20px;">
                            <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 16px;">Event Details:</h3>
                            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
                                <div style="font-weight: 600; color: #111827;">${escapeHtml(mailData.title)}</div>
                                <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Sent by: ${escapeHtml(mailData.senderName)}</div>
                            </div>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">ALUMNI EMAIL</div>
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
                                <span style="font-weight: 600; color: #475569;">${recipientEmail}</span>
                            </div>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px; font-weight: 600;">REJECTION REASON</div>
                            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px;">
                                <div style="color: #991b1b; line-height: 1.5; white-space: pre-wrap;">${safeRejectionReason}</div>
                            </div>
                        </div>

                        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 16px;">
                            <div style="font-size: 14px; color: #991b1b; font-weight: 600;">✗ This alumni has declined the invitation.</div>
                        </div>
                    </div>
                </div>
            `;
        }

        const mailOptions = {
            from: `Alumni Portal <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: emailSubject,
            html: emailContent
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Admin notification sent to: ${adminEmail} for ${action} response`);

        return { success: true };
    } catch (error) {
        console.error('❌ Failed to send admin notification:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Get all responses for a specific mail filtered by coordinator department
 * GET /api/mail/:mailId/responses/department/:department
 */
export const getMailResponsesByDepartment = async (req, res) => {
    try {
        const { mailId, department } = req.params;

        const mail = await Mail.findById(mailId);
        if (!mail) {
            return res.status(404).json({
                success: false,
                message: 'Mail not found'
            });
        }

        // Import required models
        const { default: MailResponse } = await import('../models/mailResponse.js');
        const { default: Alumni } = await import('../models/alumni.js');

        // Get all responses for this mail and populate with alumni department info
        const allResponses = await MailResponse.find({ mailId })
            .sort({ submittedAt: -1 })
            .select('recipientEmail action responseData submittedAt');

        // Filter responses by department
        const departmentFilteredResponses = [];

        for (const response of allResponses) {
            try {
                // Find alumni record by email to get their branch/department
                const alumni = await Alumni.findOne({ email: response.recipientEmail.toLowerCase() });

                // Only include responses from alumni in the coordinator's department
                if (alumni && alumni.branch === department) {
                    departmentFilteredResponses.push(response);
                }
            } catch (err) {
                console.warn(`Warning: Could not find alumni record for email ${response.recipientEmail}`);
                // Continue processing other responses
            }
        }

        // Calculate department-specific stats
        const departmentStats = {
            total: departmentFilteredResponses.length,
            accepted: departmentFilteredResponses.filter(r => r.action === 'accept').length,
            rejected: departmentFilteredResponses.filter(r => r.action === 'reject').length,
        };

        // Get total count of department alumni who received this mail
        const departmentAlumniCount = await Promise.all(
            mail.recipientEmails.map(async (email) => {
                try {
                    const alumni = await Alumni.findOne({ email: email.toLowerCase() });
                    return alumni && alumni.branch === department ? 1 : 0;
                } catch {
                    return 0;
                }
            })
        );

        const totalDepartmentRecipients = departmentAlumniCount.reduce((sum, count) => sum + count, 0);
        departmentStats.pending = totalDepartmentRecipients - departmentStats.total;

        return res.status(200).json({
            success: true,
            mail,
            responses: departmentFilteredResponses,
            stats: departmentStats,
            totalRecipients: totalDepartmentRecipients,
            department,
            message: `Showing responses from ${department} department only`
        });

    } catch (error) {
        console.error('Error fetching department mail responses:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch department mail responses',
            error: error.message
        });
    }
};

/**
 * Get mails for specific alumni (filtered by recipient email)
 * GET /api/mail/alumni/:email
 */
export const getAlumniMails = async (req, res) => {
    try {
        const { email } = req.params;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Alumni email parameter is required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Find mails where the alumni email is in the recipient list
        const mails = await Mail.find({
            recipientEmails: { $in: [email] }
        })
            .sort({ createdAt: -1 })
            .select('senderId senderName senderEmail title content recipientCount isBroadcast createdAt recipientEmails');

        // Import MailResponse model
        const { default: MailResponse } = await import('../models/mailResponse.js');

        // For each mail, find the response status for this specific alumni
        const mailsWithStatus = await Promise.all(mails.map(async (mail) => {
            const response = await MailResponse.findOne({
                mailId: mail._id,
                recipientEmail: email.toLowerCase()
            });

            return {
                ...mail.toObject(),
                responseStatus: response ? response.action : 'pending',
                responseData: response ? response.responseData : null,
                responseId: response ? response._id : null,
                submittedAt: response ? response.submittedAt : null
            };
        }));

        console.log(`📧 Found ${mails.length} mails for alumni: ${email}`);

        return res.status(200).json({
            success: true,
            mails: mailsWithStatus,
            total: mailsWithStatus.length,
            alumniEmail: email
        });

    } catch (error) {
        console.error('Error fetching alumni mails:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch alumni mails',
            error: error.message
        });
    }
};

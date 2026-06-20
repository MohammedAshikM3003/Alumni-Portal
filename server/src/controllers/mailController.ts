import crypto from 'crypto';
import type { Request, Response } from 'express';
import Mail from '../models/mail.js';
import MailToken from '../models/mailToken.js';
import createTransporter from '../utils/mailer.js';
import { findCoordinatorForUser } from '../utils/coordinatorResolver.js';

let transporter: any = null;

const getTransporter = async (): Promise<any> => {
    if (transporter) return transporter;

    if (!process.env.EMAIL_USER || process.env.EMAIL_USER.trim() === '') {
        throw new Error('Email service misconfiguration: EMAIL_USER is not set.');
    }
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
        throw new Error('Email service misconfiguration: OAuth2 credentials are not set.');
    }

    try {
        transporter = await createTransporter();
        return transporter;
    } catch (error: any) {
        console.error('Failed to create OAuth2 transporter:', {
            errorName: error?.name,
            errorMessage: error?.message,
            stack: error?.stack,
        });
        throw error;
    }
};

const getFromEmail = (): string => `Alumni Portal <${process.env.EMAIL_USER}>`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const escapeHtml = (value: any = ''): string =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const normalizeBaseUrl = (url: string | undefined): string => String(url || '').replace(/\/+$/, '');

const logEmailError = (email: string, error: any) => {
    console.error({
        timestamp: new Date().toISOString(),
        recipientEmail: email,
        errorName: error?.name || 'UnknownError',
        errorMessage: error?.message || 'No error message available',
        statusCode: error?.responseCode || error?.code || null,
    });
};

const getRequestDepartment = async (req: Request, requestedDepartment: string = ''): Promise<string> => {
    if (req.user?.role !== 'coordinator') {
        return requestedDepartment;
    }

    const coordinator = await findCoordinatorForUser(req.user);

    return coordinator?.department || '';
};

const getDepartmentRecipients = async (recipientEmails: string[] = [], department: string = ''): Promise<string[]> => {
    if (!department || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
        return [];
    }

    const { default: Alumni } = await import('../models/alumni.js');
    const departmentRecipients: string[] = [];
    const normalizedDepartment = (department || '').trim().toLowerCase();

    for (const recipientEmail of recipientEmails) {
        try {
            const alumni = await Alumni.findOne({
                email: recipientEmail.toLowerCase(),
            }).select('branch');

            const normalizedBranch = (alumni?.branch || '').trim().toLowerCase();

            if (normalizedBranch === normalizedDepartment) {
                departmentRecipients.push(recipientEmail);
            }
        } catch {
            continue;
        }
    }

    return departmentRecipients;
};

const getHODEmailsForRecipients = async (recipientEmails: string[]): Promise<string[]> => {
    try {
        const { default: Alumni } = await import('../models/alumni.js');
        const { default: Coordinator } = await import('../models/coordinator.js');

        const uniqueDepartments = new Set<string>();

        for (const email of recipientEmails) {
            try {
                const alumni = await Alumni.findOne({ email: email.toLowerCase() }).select('branch');
                if (alumni && alumni.branch) {
                    uniqueDepartments.add(alumni.branch);
                }
            } catch (err: any) {
                console.error(`Error fetching alumni for email ${email}:`, err.message);
            }
        }

        if (uniqueDepartments.size === 0) {
            return [];
        }

        const hodEmails = new Set<string>();

        for (const department of uniqueDepartments) {
            try {
                const hods = await Coordinator.find({
                    department: department,
                    $or: [{ role: 'hod' }, { roles: { $in: ['hod'] } }],
                    status: 'Active'
                }).select('email');

                for (const hod of hods) {
                    if (hod.email) {
                        hodEmails.add(hod.email.toLowerCase());
                    }
                }
            } catch (err: any) {
                console.error(`Error finding HODs for department ${department}:`, err.message);
            }
        }

        return Array.from(hodEmails);
    } catch (error: any) {
        console.error('Error in getHODEmailsForRecipients:', error.message);
        return [];
    }
};

const sendHODCopies = async (hodEmails: string[], title: string, message: string, adminName: string, collegeName: string, departments: Set<string>): Promise<{ sent: string[]; failed: any[] }> => {
    if (!hodEmails || hodEmails.length === 0) {
        return { sent: [], failed: [] };
    }

    const sent: string[] = [];
    const failed: any[] = [];

    const safeAdminName = escapeHtml(adminName);
    const safeCollegeName = escapeHtml(collegeName);
    const safeMessage = escapeHtml(message);
    const safeDepartments = Array.from(departments).map(d => escapeHtml(d)).join(', ');

    const hodHtmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; background-color: #f7f9fc;">
            <div style="background: #ffffff; border: 1px solid #e5e9f2; border-radius: 10px; padding: 22px;">
                <div style="background: #e3f2fd; border-left: 4px solid #1976d2; padding: 12px 16px; margin-bottom: 16px; border-radius: 4px;">
                    <div style="font-size: 13px; color: #1565c0; font-weight: 600;">
                        📋 FYI: Alumni Email Copy
                    </div>
                    <div style="font-size: 12px; color: #1976d2; margin-top: 4px;">
                        This email was sent to alumni from: ${safeDepartments}
                    </div>
                </div>

                <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #1f2937;">${escapeHtml(title || 'Alumni Communication')}</h2>

                <div style="margin-bottom: 12px;">
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">From</div>
                    <div style="font-size: 15px; color: #111827; font-weight: 600;">${safeAdminName}</div>
                </div>

                <div style="margin-bottom: 12px;">
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">College</div>
                    <div style="font-size: 15px; color: #111827; font-weight: 600;">${safeCollegeName}</div>
                </div>

                <div style="margin-bottom: 18px;">
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Message</div>
                    <div style="font-size: 15px; color: #111827; line-height: 1.6; white-space: pre-wrap; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">${safeMessage}</div>
                </div>

                <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px;">
                    <div style="font-size: 13px; color: #6b7280; text-align: center;">
                        This email was sent from the Alumni Portal of ${safeCollegeName}
                    </div>
                </div>
            </div>
        </div>
    `;

    for (const hodEmail of hodEmails) {
        try {
            await sendSingleEmail(
                hodEmail,
                `[FYI] ${title || 'Alumni Communication'} - Alumni Portal`,
                hodHtmlContent
            );
            sent.push(hodEmail);
        } catch (emailError: any) {
            logEmailError(hodEmail, emailError);
            failed.push({
                email: hodEmail,
                reason: emailError?.message || 'Unknown error',
                providerCode: emailError?.responseCode || emailError?.code || null,
            });
        }
    }

    return { sent, failed };
};

const sendSingleEmail = async (to: string, subject: string, html: string): Promise<any> => {
    try {
        const transport = await getTransporter();
        const result = await transport.sendMail({
            from: getFromEmail(),
            to,
            subject,
            html,
        });
        return result;
    } catch (error: any) {
        console.error('sendSingleEmail failed:', {
            recipient: to,
            errorName: error?.name,
            errorMessage: error?.message,
            errorCode: error?.code,
            errorResponse: error?.response,
        });
        throw error;
    }
};

const sendBroadcast = async (recipientEmails: string[], subject: string, html: string): Promise<{ sent: string[]; failed: any[] }> => {
    const BATCH_SIZE = 10;
    const BATCH_DELAY_MS = 1000;

    const sent: string[] = [];
    const failed: any[] = [];

    const batches = [];
    for (let i = 0; i < recipientEmails.length; i += BATCH_SIZE) {
        batches.push(recipientEmails.slice(i, i + BATCH_SIZE));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];

        const results = await Promise.allSettled(
            batch.map(async (email) => {
                await sendSingleEmail(email, subject, html);
                return email;
            })
        );

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const email = batch[i];

            if (result.status === 'fulfilled') {
                sent.push(email);
            } else {
                const error: any = result.reason;
                logEmailError(email, error);
                failed.push({
                    email,
                    reason: error?.message || 'Unknown error',
                    providerCode: error?.responseCode || error?.code || null,
                });
            }
        }

        if (batchIndex < batches.length - 1) {
            await sleep(BATCH_DELAY_MS);
        }
    }

    return { sent, failed };
};

export const sendMail = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const {
            senderId,
            senderName,
            senderEmail,
            senderLabel,
            adminName,
            collegeName,
            email,
            emails,
            title,
            message,
            isBroadcast,
            isEventInvitation,
            eventDetails,
        } = req.body;

        const recipientEmails: string[] = isBroadcast && emails ? emails : [email];

        if (!adminName || !collegeName || !message || recipientEmails.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing',
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = recipientEmails.filter((e: string) => !emailRegex.test(e));
        if (invalidEmails.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid email format: ${invalidEmails.join(', ')}`,
            });
        }

        const safeAdminName = escapeHtml(adminName);
        const safeCollegeName = escapeHtml(collegeName);
        const safeMessage = escapeHtml(message);
        const portalBaseUrl = normalizeBaseUrl(
            process.env.PORTAL_BASE_URL || process.env.PORTAL_URL || 'http://localhost:3000'
        );

        let emailsSentCount = 0;
        const failedEmails: string[] = [];

        const mailRecord = new Mail({
            senderId: senderId || 'admin',
            senderName: senderName || adminName,
            senderLabel: senderLabel || '',
            senderEmail: senderEmail || process.env.EMAIL_USER,
            title: title || `Message from ${collegeName}`,
            content: message,
            recipientCount: 0,
            recipientEmails: [],
            isBroadcast: isBroadcast || false,
            isEventInvitation: isEventInvitation || false,
            eventDetails: isEventInvitation && eventDetails ? {
                eventId: eventDetails.eventId,
                eventName: eventDetails.eventName,
                eventDate: eventDetails.eventDate ? new Date(eventDetails.eventDate) : null,
                eventVenue: eventDetails.eventVenue,
                eventTime: eventDetails.eventTime,
            } : null,
        });

        const savedMail = await mailRecord.save();

        const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        for (const recipientEmail of recipientEmails) {
            try {
                let htmlContent;

                if (isEventInvitation && eventDetails) {
                    const token = crypto.randomBytes(32).toString('hex');
                    const acceptUrl = `${portalBaseUrl}/mail/token/${token}/accept`;
                    const rejectUrl = `${portalBaseUrl}/mail/token/${token}/reject`;

                    let formattedDate = 'TBD';
                    if (eventDetails.eventDate) {
                        const dateObj = new Date(eventDetails.eventDate);
                        formattedDate = dateObj.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                    }

                    htmlContent = `
                        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; background-color: #f7f9fc;">
                            <div style="background: #ffffff; border: 1px solid #e5e9f2; border-radius: 10px; padding: 22px;">
                                <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #1f2937;">${escapeHtml(title || 'Event Invitation')}</h2>

                                <div style="margin-bottom: 12px;">
                                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Admin Name</div>
                                    <div style="font-size: 15px; color: #111827; font-weight: 600;">${safeAdminName}</div>
                                </div>

                                <div style="margin-bottom: 12px;">
                                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">College Name</div>
                                    <div style="font-size: 15px; color: #111827; font-weight: 600;">${safeCollegeName}</div>
                                </div>

                                <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border: 1px solid #a5d6a7; border-radius: 10px; padding: 16px; margin: 16px 0;">
                                    <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #2e7d32; display: flex; align-items: center;">
                                        <span style="margin-right: 8px;">📅</span> Event Details
                                    </h3>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                        <div>
                                            <div style="font-size: 11px; color: #558b2f; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Event Name</div>
                                            <div style="font-size: 14px; color: #1b5e20; font-weight: 600;">${escapeHtml(eventDetails.eventName || 'N/A')}</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 11px; color: #558b2f; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Date</div>
                                            <div style="font-size: 14px; color: #1b5e20; font-weight: 600;">${formattedDate}</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 11px; color: #558b2f; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Venue</div>
                                            <div style="font-size: 14px; color: #1b5e20; font-weight: 600;">${escapeHtml(eventDetails.eventVenue || 'N/A')}</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 11px; color: #558b2f; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Time</div>
                                            <div style="font-size: 14px; color: #1b5e20; font-weight: 600;">${escapeHtml(eventDetails.eventTime || 'N/A')}</div>
                                        </div>
                                    </div>
                                </div>

                                <div style="margin-bottom: 18px;">
                                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Message Content</div>
                                    <div style="font-size: 15px; color: #111827; line-height: 1.6; white-space: pre-wrap; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">${safeMessage}</div>
                                </div>

                                <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px; margin-bottom: 18px;">
                                    <div style="font-size: 14px; color: #92400e; font-weight: 600;">Please confirm your attendance by clicking one of the buttons below:</div>
                                </div>

                                <div style="display: flex; gap: 10px;">
                                    <a href="${acceptUrl}" style="display: inline-block; text-decoration: none; background: #16a34a; color: #ffffff; font-weight: 600; padding: 12px 24px; border-radius: 8px; margin-right: 10px; font-size: 15px;">✓ Accept Invitation</a>
                                    <a href="${rejectUrl}" style="display: inline-block; text-decoration: none; background: #dc2626; color: #ffffff; font-weight: 600; padding: 12px 24px; border-radius: 8px; font-size: 15px;">✗ Decline</a>
                                </div>
                            </div>
                        </div>
                    `;

                    await sendSingleEmail(
                        recipientEmail,
                        title || `Event Invitation from ${collegeName} - Alumni Portal`,
                        htmlContent
                    );

                    await MailToken.create({
                        token,
                        mailId: savedMail._id,
                        recipientEmail,
                        isTokenValid: true,
                        expiresAt: tokenExpiry,
                    });
                } else {
                    htmlContent = `
                        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; background-color: #f7f9fc;">
                            <div style="background: #ffffff; border: 1px solid #e5e9f2; border-radius: 10px; padding: 22px;">
                                <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #1f2937;">${escapeHtml(title || 'New Message')}</h2>

                                <div style="margin-bottom: 12px;">
                                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">From</div>
                                    <div style="font-size: 15px; color: #111827; font-weight: 600;">${safeAdminName}</div>
                                </div>

                                <div style="margin-bottom: 12px;">
                                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">College</div>
                                    <div style="font-size: 15px; color: #111827; font-weight: 600;">${safeCollegeName}</div>
                                </div>

                                <div style="margin-bottom: 18px;">
                                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Message</div>
                                    <div style="font-size: 15px; color: #111827; line-height: 1.6; white-space: pre-wrap; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">${safeMessage}</div>
                                </div>

                                <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px;">
                                    <div style="font-size: 13px; color: #6b7280; text-align: center;">
                                        This email was sent from the Alumni Portal of ${safeCollegeName}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    await sendSingleEmail(
                        recipientEmail,
                        title || `Message from ${collegeName} - Alumni Portal`,
                        htmlContent
                    );
                }

                emailsSentCount++;
            } catch (emailError: any) {
                logEmailError(recipientEmail, emailError);
                failedEmails.push(recipientEmail);
            }
        }

        let hodEmailsSent: string[] = [];
        let hodEmailsFailed: any[] = [];

        if (emailsSentCount > 0) {
            try {
                const hodEmails = await getHODEmailsForRecipients(recipientEmails.filter((e: string) => !failedEmails.includes(e)));

                if (hodEmails.length > 0) {
                    const { default: Alumni } = await import('../models/alumni.js');
                    const departments = new Set<string>();

                    for (const email of recipientEmails) {
                        if (!failedEmails.includes(email)) {
                            try {
                                const alumni = await Alumni.findOne({ email: email.toLowerCase() }).select('branch');
                                if (alumni && alumni.branch) {
                                    departments.add(alumni.branch);
                                }
                            } catch {
                                continue;
                            }
                        }
                    }

                    const hodResult = await sendHODCopies(hodEmails, title, message, adminName, collegeName, departments);
                    hodEmailsSent = hodResult.sent;
                    hodEmailsFailed = hodResult.failed;

                    if (hodEmailsSent.length > 0) {
                        console.log(`HOD emails sent: ${hodEmailsSent.length} to coordinators`);
                    }
                    if (hodEmailsFailed.length > 0) {
                        console.log(`HOD email failures: ${hodEmailsFailed.length}`);
                    }
                }
            } catch (hodError: any) {
                console.error('Error sending HOD coordinator copies:', hodError.message);
            }
        }

        savedMail.recipientCount = emailsSentCount;
        savedMail.recipientEmails = recipientEmails.filter((e: string) => !failedEmails.includes(e));
        savedMail.ccEmails = hodEmailsSent;
        savedMail.ccEmailsSent = hodEmailsSent.length;
        savedMail.hasTokens = isEventInvitation && emailsSentCount > 0;
        savedMail.tokenGeneratedAt = isEventInvitation && emailsSentCount > 0 ? new Date() : undefined;
        savedMail.status = isEventInvitation ? 'pending' : 'completed';
        await savedMail.save();

        if (failedEmails.length > 0 && emailsSentCount > 0) {
            return res.status(200).json({
                success: true,
                message: `Email sent to ${emailsSentCount} recipient(s). Failed: ${failedEmails.length}`,
                emailsSent: emailsSentCount,
                failedEmails,
            });
        }

        if (emailsSentCount === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send any emails',
                failedEmails,
            });
        }

        return res.status(200).json({
            success: true,
            message: `Email sent successfully to ${emailsSentCount} recipient(s)`,
            emailsSent: emailsSentCount,
        });
    } catch (error: any) {
        logEmailError('N/A', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send email. Please try again later.',
            error: error.message,
        });
    }
};

export const getSentMails = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const mails = await Mail.find({})
            .sort({ createdAt: -1 })
            .select(
                'senderId senderName senderLabel senderEmail title content recipientCount isBroadcast isEventInvitation status createdAt recipientEmails'
            );

        const { default: MailResponse } = await import('../models/mailResponse.js');

        const mailsWithStats = await Promise.all(
            mails.map(async (mail) => {
                if (mail.status === 'completed' || !mail.isEventInvitation) {
                    return {
                        ...mail.toObject(),
                        responseStats: {
                            total: 0,
                            accepted: 0,
                            rejected: 0,
                            pending: 0,
                        },
                        dominantStatus: 'completed',
                    };
                }

                const responses = await MailResponse.find({ mailId: mail._id });

                const stats = {
                    total: responses.length,
                    accepted: responses.filter((r: any) => r.action === 'accept').length,
                    rejected: responses.filter((r: any) => r.action === 'reject').length,
                    pending: (mail.recipientCount || 0) - responses.length,
                };

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
                    dominantStatus,
                };
            })
        );

        return res.status(200).json({
            success: true,
            mails: mailsWithStats,
            total: mailsWithStats.length,
        });
    } catch (error: any) {
        logEmailError('N/A', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch sent mails',
            error: error.message,
        });
    }
};

export const getMailResponses = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const mailId = req.params.mailId as string;

        const mail = await Mail.findById(mailId);
        if (!mail) {
            return res.status(404).json({
                success: false,
                message: 'Mail not found',
            });
        }

        const { default: MailResponse } = await import('../models/mailResponse.js');
        const { default: Alumni } = await import('../models/alumni.js');

        const responses = await MailResponse.find({ mailId })
            .sort({ submittedAt: -1 })
            .select('recipientEmail action responseData submittedAt');

        const responsesWithPhotos = await Promise.all(
            responses.map(async (response) => {
                const responseObj: any = response.toObject();
                if (response.action === 'accept') {
                    try {
                        const alumni = await Alumni.findOne({
                            email: response.recipientEmail
                        }).select('profilePhoto');
                        if (alumni && alumni.profilePhoto) {
                            const photoStr = alumni.profilePhoto.toString();
                            const photoUrl = photoStr.startsWith('http')
                                ? photoStr
                                : photoStr.startsWith('/api')
                                    ? photoStr
                                    : `/api/images/${photoStr}`;
                            responseObj.profilePhoto = photoUrl;
                        }
                    } catch (err) {
                        console.error('Error fetching alumni profile:', err);
                    }
                }
                return responseObj;
            })
        );

        const stats = {
            total: responses.length,
            accepted: responses.filter((r: any) => r.action === 'accept').length,
            rejected: responses.filter((r: any) => r.action === 'reject').length,
            pending: (mail.recipientCount || 0) - responses.length,
        };

        return res.status(200).json({
            success: true,
            mail,
            responses: responsesWithPhotos,
            stats,
            totalRecipients: mail.recipientCount,
        });
    } catch (error: any) {
        logEmailError('N/A', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch mail responses',
            error: error.message,
        });
    }
};

export const getMailById = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const mailId = req.params.mailId as string;

        const mail = await Mail.findById(mailId);

        if (!mail) {
            return res.status(404).json({
                success: false,
                message: 'Mail not found',
            });
        }

        const department = await getRequestDepartment(req);
        const visibleRecipientEmails =
            req.user?.role === 'coordinator'
                ? await getDepartmentRecipients(mail.recipientEmails, department)
                : mail.recipientEmails;

        if (req.user?.role === 'coordinator' && (!visibleRecipientEmails || visibleRecipientEmails.length === 0)) {
            console.log(`[MAIL ACCESS DENIED] Coordinator: ${req.user?.email} | Department: ${department} | Mail recipients: ${mail.recipientEmails?.join(', ')}`);
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this mail',
            });
        }

        const { default: Alumni } = await import('../models/alumni.js');

        const recipients = await Promise.all(
            (visibleRecipientEmails || []).map(async (email) => {
                try {
                    const alumni = await Alumni.findOne({
                        email: email.toLowerCase()
                    }).select('profilePhoto name email branch yearFrom yearTo');

                    if (alumni && alumni.profilePhoto) {
                        const photoStr = alumni.profilePhoto.toString();
                        const photoUrl = photoStr.startsWith('http')
                            ? photoStr
                            : photoStr.startsWith('/api')
                                ? photoStr
                                : `/api/images/${photoStr}`;

                        return {
                            name: alumni.name || email.split('@')[0],
                            email: email,
                            profilePhoto: photoUrl,
                            branch: alumni.branch,
                            batch: alumni.yearFrom && alumni.yearTo ? `${alumni.yearFrom}-${alumni.yearTo}` : null
                        };
                    }

                    return {
                        name: alumni?.name || email.split('@')[0],
                        email: email,
                        profilePhoto: '',
                        branch: alumni?.branch || null,
                        batch: null
                    };
                } catch (err) {
                    console.error('Error fetching alumni profile:', err);
                    return {
                        name: email.split('@')[0],
                        email: email,
                        profilePhoto: '',
                        branch: null,
                        batch: null
                    };
                }
            })
        );

        const mailWithRecipients = {
            ...mail.toObject(),
            recipientEmails: visibleRecipientEmails,
            recipientCount: (visibleRecipientEmails || []).length as number,
            recipients
        };

        return res.status(200).json({
            success: true,
            mail: mailWithRecipients,
        });
    } catch (error: any) {
        logEmailError('N/A', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch mail',
            error: error.message,
        });
    }
};

export const getDepartmentMails = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const department = await getRequestDepartment(req, req.params.department as string);

        if (!department) {
            return res.status(400).json({
                success: false,
                message: 'Department parameter is required',
            });
        }

        const mails = await Mail.find({})
            .sort({ createdAt: -1 })
            .select(
                'senderId senderName senderEmail title content recipientCount isBroadcast isEventInvitation status createdAt recipientEmails'
            );

        const { default: MailResponse } = await import('../models/mailResponse.js');

        const mailsWithStats = await Promise.all(
            mails.map(async (mail) => {
                const departmentRecipientEmails = await getDepartmentRecipients(
                    mail.recipientEmails,
                    department
                );
                const departmentRecipientEmailSet = new Set(
                    departmentRecipientEmails.map((email) => email.toLowerCase())
                );

                if (departmentRecipientEmails.length === 0) {
                    return null;
                }

                if (mail.status === 'completed' || !mail.isEventInvitation) {
                    return {
                        ...mail.toObject(),
                        recipientEmails: departmentRecipientEmails,
                        recipientCount: departmentRecipientEmails.length,
                        responseStats: {
                            total: 0,
                            accepted: 0,
                            rejected: 0,
                            pending: 0,
                        },
                        dominantStatus: 'completed',
                        departmentRecipientCount: departmentRecipientEmails.length,
                    };
                }

                const allResponses = await MailResponse.find({ mailId: mail._id });

                const departmentResponses = [];

                for (const response of allResponses) {
                    if (departmentRecipientEmailSet.has(response.recipientEmail.toLowerCase())) {
                        departmentResponses.push(response);
                    }
                }

                const departmentRecipientCount = departmentRecipientEmails.length;

                const stats = {
                    total: departmentResponses.length,
                    accepted: departmentResponses.filter((r: any) => r.action === 'accept').length,
                    rejected: departmentResponses.filter((r: any) => r.action === 'reject').length,
                    pending: departmentRecipientCount - departmentResponses.length,
                };

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
                    recipientEmails: departmentRecipientEmails,
                    recipientCount: departmentRecipientCount,
                    responseStats: stats,
                    dominantStatus,
                    departmentRecipientCount,
                };
            })
        );

        const filteredMails = mailsWithStats.filter(Boolean);

        return res.status(200).json({
            success: true,
            mails: filteredMails,
            total: filteredMails.length,
            department,
            message: `Showing mail statistics for ${department} department only`,
        });
    } catch (error: any) {
        logEmailError('N/A', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch department mails',
            error: error.message,
        });
    }
};

export const sendAdminNotification = async (responseData: any, mailData: any, action: string): Promise<any> => {
    try {
        const adminEmail = mailData.senderEmail;

        let emailSubject;
        let emailContent;

        if (action === 'accept') {
            emailSubject = `Acceptance Response Received - ${mailData.title}`;

            const safeFullName = escapeHtml(responseData.fullName || 'N/A');
            const safeDesignation = escapeHtml(responseData.designation || 'N/A');
            const safeCompanyName = escapeHtml(responseData.companyName || 'N/A');
            const safeMobileNo = escapeHtml(responseData.mobileNo || 'N/A');
            const safePersonalEmail = escapeHtml(responseData.personalEmail || 'N/A');
            const safeOfficialEmail = escapeHtml(responseData.officialEmail || 'N/A');
            const safeLocation = escapeHtml(responseData.location || 'N/A');
            const safeBatchYears = responseData.batchYear
                ? `${responseData.batchYear.startYear || 'N/A'} - ${responseData.batchYear.endYear || 'N/A'}`
                : 'N/A';

            emailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 720px; margin: 0 auto; padding: 20px; background-color: #f7f9fc;">
                    <div style="background: #ffffff; border: 1px solid #e5e9f2; border-radius: 10px; padding: 22px;">
                        <div style="background: #16a34a; color: white; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
                            <h2 style="margin: 0; font-size: 18px;">New Acceptance Response Received</h2>
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
                            <div style="font-size: 14px; color: #166534; font-weight: 600;">This alumni has accepted the invitation and provided their updated information.</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (action === 'reject') {
            emailSubject = `Rejection Response Received - ${mailData.title}`;

            const safeRejectionReason = escapeHtml(responseData.rejectionReason || 'No reason provided');
            const recipientEmail = escapeHtml(responseData.recipientEmail || 'Unknown');

            emailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; background-color: #f7f9fc;">
                    <div style="background: #ffffff; border: 1px solid #e5e9f2; border-radius: 10px; padding: 22px;">
                        <div style="background: #dc2626; color: white; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
                            <h2 style="margin: 0; font-size: 18px;">New Rejection Response Received</h2>
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
                            <div style="font-size: 14px; color: #991b1b; font-weight: 600;">This alumni has declined the invitation.</div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (emailSubject && emailContent) {
            await sendSingleEmail(adminEmail, emailSubject, emailContent);
        }

        return { success: true };
    } catch (error: any) {
        logEmailError(mailData?.senderEmail || 'N/A', error);
        return { success: false, error: error.message };
    }
};

export const getMailResponsesByDepartment = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const mailId = req.params.mailId as string;
        const department = await getRequestDepartment(req, req.params.department as string);

        const mail = await Mail.findById(mailId);
        if (!mail) {
            return res.status(404).json({
                success: false,
                message: 'Mail not found',
            });
        }

        const { default: MailResponse } = await import('../models/mailResponse.js');
        const departmentRecipientEmails = await getDepartmentRecipients(mail.recipientEmails, department);
        const departmentRecipientEmailSet = new Set(
            departmentRecipientEmails.map((email) => email.toLowerCase())
        );

        if (req.user?.role === 'coordinator' && departmentRecipientEmails.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this mail',
            });
        }

        const allResponses = await MailResponse.find({ mailId })
            .sort({ submittedAt: -1 })
            .select('recipientEmail action responseData submittedAt');

        const departmentFilteredResponses = [];

        for (const response of allResponses) {
            if (departmentRecipientEmailSet.has(response.recipientEmail.toLowerCase())) {
                departmentFilteredResponses.push(response);
            }
        }

        const departmentStats = {
            total: departmentFilteredResponses.length,
            accepted: departmentFilteredResponses.filter((r: any) => r.action === 'accept').length,
            rejected: departmentFilteredResponses.filter((r: any) => r.action === 'reject').length,
            pending: 0
        };

        const totalDepartmentRecipients = departmentRecipientEmails.length;
        departmentStats.pending = totalDepartmentRecipients - departmentStats.total;

        return res.status(200).json({
            success: true,
            mail,
            responses: departmentFilteredResponses,
            stats: departmentStats,
            totalRecipients: totalDepartmentRecipients,
            department,
            message: `Showing responses from ${department} department only`,
        });
    } catch (error: any) {
        logEmailError('N/A', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch department mail responses',
            error: error.message,
        });
    }
};

export const getAlumniMails = async (req: Request, res: Response): Promise<void | any> => {
    try {
        const email = req.params.email as string;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Alumni email parameter is required',
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
            });
        }

        const mails = await Mail.find({
            recipientEmails: { $in: [email] },
        })
            .sort({ createdAt: -1 })
            .select(
                'senderId senderName senderEmail title content recipientCount isBroadcast isEventInvitation status createdAt recipientEmails'
            );

        const { default: MailResponse } = await import('../models/mailResponse.js');

        const mailsWithStatus = await Promise.all(
            mails.map(async (mail) => {
                const response = await MailResponse.findOne({
                    mailId: mail._id,
                    recipientEmail: (email as string).toLowerCase(),
                });

                return {
                    ...mail.toObject(),
                    responseStatus: response ? response.action : 'pending',
                    responseData: response ? response.responseData : null,
                    responseId: response ? response._id : null,
                    submittedAt: response ? response.submittedAt : null,
                };
            })
        );

        return res.status(200).json({
            success: true,
            mails: mailsWithStatus,
            total: mailsWithStatus.length,
            alumniEmail: email,
        });
    } catch (error: any) {
        logEmailError(req.params?.email as string || 'N/A', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch alumni mails',
            error: error.message,
        });
    }
};

export { sendBroadcast };

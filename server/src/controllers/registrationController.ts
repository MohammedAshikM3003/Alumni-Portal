import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { Request, Response } from 'express';
import RegistrationToken from '../models/registrationToken.js';
import User from '../models/user.js';
import Alumni from '../models/alumni.js';
import { generateToken } from '../security/jwt.js';
import createTransporter from '../utils/mailer.js';

const normalizeBaseUrl = (url: string | undefined): string => String(url || '').replace(/\/+$/, '');

const createTraceId = (): string => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const getErrorDebugInfo = (error: any) => ({
	message: error?.message || 'Unknown error',
	code: error?.code || null,
	command: error?.command || null,
	responseCode: error?.responseCode || null,
	response: error?.response || null,
	stack: error?.stack ? error.stack.split('\n').slice(0, 3).join(' | ') : null,
});

const logStep = (traceId: string, flow: string, step: number, details: any = {}) => {
	// Disabled in production
};

const logBreak = (traceId: string, flow: string, step: number, reason: string, details: any = {}) => {
	// Disabled in production
};

const sendStepFailure = (res: Response, status: number, traceId: string, flow: string, step: number, message: string, extra: any = {}) => {
	return res.status(status).json({
		success: false,
		message,
		traceId,
		flow,
		step,
		...extra,
	});
};

/**
 * Send registration links to multiple emails
 */
export const sendRegistrationLinks = async (req: Request, res: Response): Promise<void | any> => {
	const traceId = createTraceId();
	try {
		const { emails } = req.body;
		logStep(traceId, 'send-links', 1, {
			emailCount: Array.isArray(emails) ? emails.length : 0,
			hasAuthHeader: Boolean(req.headers.authorization),
			hasEmailUser: Boolean(process.env.EMAIL_USER),
			hasOAuth2Credentials: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN),
			portalUrl: process.env.PORTAL_URL || 'http://localhost:5173',
		});

		if (!emails || !Array.isArray(emails) || emails.length === 0) {
			logBreak(traceId, 'send-links', 2, 'Invalid or empty emails array', { emails });
			return sendStepFailure(res, 400, traceId, 'send-links', 2, 'Please provide an array of emails');
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const invalidEmails = emails.filter((e: string) => !emailRegex.test(e));
		if (invalidEmails.length > 0) {
			logBreak(traceId, 'send-links', 3, 'Invalid email format', { invalidEmails });
			return sendStepFailure(
				res,
				400,
				traceId,
				'send-links',
				3,
				`Invalid email format: ${invalidEmails.join(', ')}`,
				{ invalidEmails }
			);
		}

		logStep(traceId, 'send-links', 4, { message: 'Creating OAuth2 transporter' });
		const transporter = await createTransporter();
		const portalBaseUrl = normalizeBaseUrl(process.env.PORTAL_URL || 'http://localhost:5173');

		const sent: string[] = [];
		const failed: any[] = [];

		for (const [index, email] of emails.entries()) {
			try {
				logStep(traceId, 'send-links', 5, { index, email, message: 'Processing recipient' });
				
				const existingUser = await User.findOne({ email: email.toLowerCase() });
				if (existingUser) {
					logBreak(traceId, 'send-links', 6, 'Existing user found', { index, email });
					failed.push({ email, reason: 'User already registered' });
					continue;
				}

				const existingToken = await RegistrationToken.findOne({
					email: email.toLowerCase(),
					status: 'pending',
					isUsed: false,
					expiresAt: { $gt: new Date() },
				});

				if (existingToken) {
					logBreak(traceId, 'send-links', 7, 'Existing active token found', { index, email });
					failed.push({ email, reason: 'Registration link already sent' });
					continue;
				}

				const token = crypto.randomBytes(32).toString('hex');
				const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
				logStep(traceId, 'send-links', 8, {
					index,
					email,
					tokenPrefix: token.slice(0, 8),
					expiresAt,
					message: 'Token prepared in memory (not yet stored)',
				});

				const registrationUrl = `${portalBaseUrl}/register/alumni/${token}`;

				const emailHtml = `
					<!DOCTYPE html>
					<html>
					<head>
						<meta charset="utf-8">
						<meta name="viewport" content="width=device-width, initial-scale=1.0">
					</head>
					<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
						<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
							<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
								<h1 style="color: white; margin: 0; font-size: 24px;">Alumni Portal Registration</h1>
							</div>
							<div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
								<p style="color: #333; font-size: 16px; line-height: 1.6;">
									Hello,
								</p>
								<p style="color: #333; font-size: 16px; line-height: 1.6;">
									You have been invited to register on the Alumni Portal. Click the button below to complete your registration.
								</p>
								<div style="text-align: center; margin: 30px 0;">
									<a href="${registrationUrl}"
									   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
										Complete Registration
									</a>
								</div>
								<p style="color: #666; font-size: 14px; line-height: 1.6;">
									<strong>Note:</strong> This link will expire in <strong>2 days</strong>. Please complete your registration before then.
								</p>
								<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
								<p style="color: #999; font-size: 12px; text-align: center;">
									If you did not request this registration, please ignore this email.
								</p>
							</div>
						</div>
					</body>
					</html>
				`;

				logStep(traceId, 'send-links', 9, { index, email, registrationUrl });
				const mailInfo = await transporter.sendMail({
					from: `"Alumni Portal" <${process.env.EMAIL_USER}>`,
					to: email,
					subject: 'Complete Your Alumni Portal Registration',
					html: emailHtml,
				});
				logStep(traceId, 'send-links', 10, {
					index,
					email,
					messageId: mailInfo?.messageId,
				});

				const storedToken = await RegistrationToken.create({
					token,
					email: email.toLowerCase(),
					expiresAt,
					status: 'pending',
				});
				logStep(traceId, 'send-links', 10.1, {
					index,
					email,
					tokenId: storedToken._id,
					message: 'Token stored after successful mail send',
				});

				sent.push(email);
			} catch (error: any) {
				console.error(`[RegistrationMail:${traceId}][send-links][BREAK at Step 9] Failed to send`, {
					index,
					email,
					...getErrorDebugInfo(error),
				});
				failed.push({ email, reason: error.message });
			}
		}

		logStep(traceId, 'send-links', 11, {
			sentCount: sent.length,
			failedCount: failed.length,
		});

		if (sent.length === 0 && failed.length > 0) {
			const allAlreadySent = failed.every(f => f.reason === 'Registration link already sent');
			return res.status(allAlreadySent ? 409 : 400).json({
				success: false,
				message: 'Registration links already sent to these email addresses.',
				sent: 0,
				failed,
				traceId,
				flow: 'send-links',
				step: 11,
				errorCode: allAlreadySent ? 'ALREADY_SENT' : 'ALL_SENDS_FAILED',
			});
		}

		res.status(200).json({
			success: true,
			message: `Sent ${sent.length} registration link(s)`,
			sent: sent.length,
			failed: failed,
			traceId,
			flow: 'send-links',
			step: 11,
		});
	} catch (error: any) {
		const debug = getErrorDebugInfo(error);
		console.error(`[RegistrationMail:${traceId}][send-links][BREAK at Step 12] Error sending registration links`, debug);
		res.status(500).json({
			success: false,
			message: debug.message || 'Server error',
			traceId,
			flow: 'send-links',
			step: 12,
			debug,
		});
	}
};

/**
 * Send registration link to single email (Admin form)
 */
export const sendSingleRegistrationLink = async (req: Request, res: Response): Promise<void | any> => {
	const traceId = createTraceId();
	try {
		const { email } = req.body;
		logStep(traceId, 'send-single-link', 1, {
			email,
			hasAuthHeader: Boolean(req.headers.authorization),
			hasEmailUser: Boolean(process.env.EMAIL_USER),
			hasOAuth2Credentials: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN),
			portalUrl: process.env.PORTAL_URL || 'http://localhost:5173',
		});

		if (!email) {
			logBreak(traceId, 'send-single-link', 2, 'Email missing');
			return sendStepFailure(res, 400, traceId, 'send-single-link', 2, 'Email is required');
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			logBreak(traceId, 'send-single-link', 3, 'Invalid email format', { email });
			return sendStepFailure(res, 400, traceId, 'send-single-link', 3, 'Invalid email format');
		}

		logStep(traceId, 'send-single-link', 4, { email, message: 'Checking existing user' });
		const existingUser = await User.findOne({ email: email.toLowerCase() });
		if (existingUser) {
			logBreak(traceId, 'send-single-link', 4, 'User already exists', { email });
			return sendStepFailure(res, 400, traceId, 'send-single-link', 4, 'User already registered with this email');
		}

		logStep(traceId, 'send-single-link', 5, { email, message: 'Checking existing active token' });
		const existingToken = await RegistrationToken.findOne({
			email: email.toLowerCase(),
			status: 'pending',
			isUsed: false,
			expiresAt: { $gt: new Date() },
		});

		if (existingToken) {
			logBreak(traceId, 'send-single-link', 5, 'Active token already exists', { email });
			return sendStepFailure(
				res,
				400,
				traceId,
				'send-single-link',
				5,
				'Registration link already sent to this email. Please check inbox.'
			);
		}

		logStep(traceId, 'send-single-link', 6, { email, message: 'Preparing token in memory' });
		const token = crypto.randomBytes(32).toString('hex');
		const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
		logStep(traceId, 'send-single-link', 7, {
			email,
			tokenPrefix: token.slice(0, 8),
			expiresAt,
			message: 'Token prepared in memory (not yet stored)',
		});

		logStep(traceId, 'send-single-link', 8, { message: 'Creating OAuth2 transporter' });
		const transporter = await createTransporter();
		const portalBaseUrl = normalizeBaseUrl(process.env.PORTAL_URL || 'http://localhost:5173');

		const registrationUrl = `${portalBaseUrl}/register/alumni/${token}`;

		const emailHtml = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
				<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
						<h1 style="color: white; margin: 0; font-size: 24px;">Alumni Portal Registration</h1>
					</div>
					<div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
						<p style="color: #333; font-size: 16px; line-height: 1.6;">
							Hello,
						</p>
						<p style="color: #333; font-size: 16px; line-height: 1.6;">
							You have been invited to register on the Alumni Portal. Click the button below to complete your registration.
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${registrationUrl}"
							   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
								Complete Registration
							</a>
						</div>
						<p style="color: #666; font-size: 14px; line-height: 1.6;">
							<strong>Note:</strong> This link will expire in <strong>2 days</strong>. Please complete your registration before then.
						</p>
						<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
						<p style="color: #999; font-size: 12px; text-align: center;">
							If you did not request this registration, please ignore this email.
						</p>
					</div>
				</div>
			</body>
			</html>
		`;

		logStep(traceId, 'send-single-link', 9, { email, registrationUrl, message: 'Sending email' });
		const mailInfo = await transporter.sendMail({
			from: `"Alumni Portal" <${process.env.EMAIL_USER}>`,
			to: email,
			subject: 'Complete Your Alumni Portal Registration',
			html: emailHtml,
		});
		logStep(traceId, 'send-single-link', 10, {
			email,
			messageId: mailInfo?.messageId,
		});

		const storedToken = await RegistrationToken.create({
			token,
			email: email.toLowerCase(),
			expiresAt,
			status: 'pending',
		});
		logStep(traceId, 'send-single-link', 11, {
			email,
			tokenId: storedToken._id,
			message: 'Token stored after successful mail send',
		});

		res.status(200).json({
			success: true,
			message: `Registration link sent successfully to ${email}`,
			traceId,
			flow: 'send-single-link',
			step: 11,
		});
	} catch (error: any) {
		const debug = getErrorDebugInfo(error);
		console.error(`[RegistrationMail:${traceId}][send-single-link][BREAK at Step 12] Error sending registration link`, debug);
		res.status(500).json({
			success: false,
			message: debug.message || 'Server error',
			traceId,
			flow: 'send-single-link',
			step: 12,
			debug,
		});
	}
};

/**
 * Send registration link with pre-filled data (Admin form with details)
 */
export const sendPrefilledRegistrationLink = async (req: Request, res: Response): Promise<void | any> => {
	const traceId = createTraceId();
	try {
		const { email, prefilledData } = req.body;
		logStep(traceId, 'send-prefilled-link', 1, {
			email,
			hasPrefilledData: Boolean(prefilledData),
			hasAuthHeader: Boolean(req.headers.authorization),
			hasEmailUser: Boolean(process.env.EMAIL_USER),
			hasOAuth2Credentials: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN),
			portalUrl: process.env.PORTAL_URL || 'http://localhost:5173',
		});

		if (!email) {
			logBreak(traceId, 'send-prefilled-link', 2, 'Email missing');
			return sendStepFailure(res, 400, traceId, 'send-prefilled-link', 2, 'Email is required');
		}

		if (!prefilledData) {
			logBreak(traceId, 'send-prefilled-link', 3, 'Pre-filled data missing', { email });
			return sendStepFailure(res, 400, traceId, 'send-prefilled-link', 3, 'Pre-filled data is required');
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			logBreak(traceId, 'send-prefilled-link', 4, 'Invalid email format', { email });
			return sendStepFailure(res, 400, traceId, 'send-prefilled-link', 4, 'Invalid email format');
		}

		logStep(traceId, 'send-prefilled-link', 5, { email, message: 'Checking existing user' });
		const existingUser = await User.findOne({ email: email.toLowerCase() });
		if (existingUser) {
			logBreak(traceId, 'send-prefilled-link', 5, 'User already exists', { email });
			return sendStepFailure(res, 400, traceId, 'send-prefilled-link', 5, 'User already registered with this email');
		}

		logStep(traceId, 'send-prefilled-link', 6, { email, message: 'Checking existing active token' });
		const existingToken = await RegistrationToken.findOne({
			email: email.toLowerCase(),
			status: 'pending',
			isUsed: false,
			expiresAt: { $gt: new Date() },
		});

		if (existingToken) {
			logBreak(traceId, 'send-prefilled-link', 6, 'Active token already exists', { email });
			return sendStepFailure(
				res,
				400,
				traceId,
				'send-prefilled-link',
				6,
				'Registration link already sent to this email. Please check inbox.'
			);
		}

		logStep(traceId, 'send-prefilled-link', 7, { email, message: 'Preparing token in memory' });
		const token = crypto.randomBytes(32).toString('hex');
		const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
		logStep(traceId, 'send-prefilled-link', 8, {
			email,
			tokenPrefix: token.slice(0, 8),
			expiresAt,
			message: 'Token prepared in memory (not yet stored)',
		});

		logStep(traceId, 'send-prefilled-link', 9, { message: 'Creating OAuth2 transporter' });
		const transporter = await createTransporter();
		const portalBaseUrl = normalizeBaseUrl(process.env.PORTAL_URL || 'http://localhost:5173');

		const registrationUrl = `${portalBaseUrl}/register/alumni/${token}`;

		const emailHtml = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
				<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
					<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
						<h1 style="color: white; margin: 0; font-size: 24px;">Alumni Portal Registration</h1>
					</div>
					<div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
						<p style="color: #333; font-size: 16px; line-height: 1.6;">
							Hello ${prefilledData.name || ''},
						</p>
						<p style="color: #333; font-size: 16px; line-height: 1.6;">
							You have been invited to complete your registration on the Alumni Portal. Some of your information has been pre-filled by the admin. Please review and complete the remaining details.
						</p>
						<div style="text-align: center; margin: 30px 0;">
							<a href="${registrationUrl}"
							   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
								Complete Registration
							</a>
						</div>
						<p style="color: #666; font-size: 14px; line-height: 1.6;">
							<strong>Note:</strong> This link will expire in <strong>2 days</strong>. Please complete your registration before then.
						</p>
						<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
						<p style="color: #999; font-size: 12px; text-align: center;">
							If you did not request this registration, please ignore this email.
						</p>
					</div>
				</div>
			</body>
			</html>
		`;

		logStep(traceId, 'send-prefilled-link', 10, { email, registrationUrl, message: 'Sending email' });
		const mailInfo = await transporter.sendMail({
			from: `"Alumni Portal" <${process.env.EMAIL_USER}>`,
			to: email,
			subject: 'Complete Your Alumni Portal Registration',
			html: emailHtml,
		});
		logStep(traceId, 'send-prefilled-link', 11, {
			email,
			messageId: mailInfo?.messageId,
		});

		const storedToken = await RegistrationToken.create({
			token,
			email: email.toLowerCase(),
			expiresAt,
			prefilledData,
			status: 'pending',
		});
		logStep(traceId, 'send-prefilled-link', 12, {
			email,
			tokenId: storedToken._id,
			message: 'Token stored after successful mail send',
		});

		res.status(200).json({
			success: true,
			message: `Registration link with pre-filled data sent successfully to ${email}`,
			traceId,
			flow: 'send-prefilled-link',
			step: 12,
		});
	} catch (error: any) {
		const debug = getErrorDebugInfo(error);
		console.error(`[RegistrationMail:${traceId}][send-prefilled-link][BREAK at Step 13] Error sending pre-filled registration link`, debug);
		res.status(500).json({
			success: false,
			message: debug.message || 'Server error',
			traceId,
			flow: 'send-prefilled-link',
			step: 13,
			debug,
		});
	}
};

/**
 * Validate a registration token
 */
export const validateRegistrationToken = async (req: Request, res: Response): Promise<void | any> => {
	try {
		const { token } = req.params;

		if (!token) {
			return res.status(400).json({
				success: false,
				message: 'Token is required',
			});
		}

		const tokenRecord = await (RegistrationToken as any).findValidToken(token);

		if (!tokenRecord) {
			return res.status(401).json({
				success: false,
				message: 'Invalid, expired, or already used registration link',
			});
		}

		res.status(200).json({
			success: true,
			email: tokenRecord.email,
			prefilledData: tokenRecord.prefilledData,
			expiresAt: tokenRecord.expiresAt,
		});
	} catch (error) {
		console.error('Error validating token:', error);
		res.status(500).json({
			success: false,
			message: 'Server error',
		});
	}
};

/**
 * Submit registration with token
 */
export const submitRegistration = async (req: Request, res: Response): Promise<void | any> => {
	try {
		const { token } = req.params;
		const {
			password,
			confirmPassword,
			registerNumber,
			name,
			dob,
			yearFrom,
			yearTo,
			degree,
			branch,
			fatherName,
			presentAddress,
			permanentAddress,
			hasCompetitiveExams,
			competitiveExams,
			collegeQualifications,
			placementType,
			companyName,
			designation,
			companyAddress,
			employmentRemarks,
			isEntrepreneur,
			entrepreneurDetails,
			maritalStatus,
			spouseDetails,
			extraCurricular,
			otherInfo,
			knownAlumni,
			signature,
		} = req.body;

		const tokenRecord = await (RegistrationToken as any).findValidToken(token);
		if (!tokenRecord) {
			return res.status(401).json({
				success: false,
				message: 'Invalid, expired, or already used registration link',
			});
		}

		const email = tokenRecord.email;

		if (!password || !confirmPassword) {
			return res.status(400).json({
				success: false,
				message: 'Password and confirm password are required',
			});
		}

		if (password !== confirmPassword) {
			return res.status(400).json({
				success: false,
				message: 'Passwords do not match',
			});
		}

		if (password.length < 6) {
			return res.status(400).json({
				success: false,
				message: 'Password must be at least 6 characters',
			});
		}

		if (!registerNumber || !name || !dob || !yearFrom || !yearTo || !degree || !branch) {
			return res.status(400).json({
				success: false,
				message: 'Required fields are missing (registerNumber, name, dob, yearFrom, yearTo, degree, branch)',
			});
		}

		let existingAlumni = await Alumni.findOne({
			$or: [{ email }, { registerNumber }],
		});

		let existingUser = await User.findOne({
			$or: [{ email }, { userId: registerNumber }],
		});

		const hashedPassword = await bcrypt.hash(password, 12);

		let newUser;
		let alumni;

		if (existingAlumni) {
			console.log(`Alumni exists for email ${email}. Updating record...`);

			if (!existingUser) {
				newUser = await User.create({
					userId: registerNumber,
					name,
					email,
					password: hashedPassword,
					role: 'alumni',
				});

				existingAlumni.userId = newUser._id;
			} else {
				existingUser.password = hashedPassword;
				existingUser.name = name;
				await existingUser.save();
				newUser = existingUser;
			}

			existingAlumni.registerNumber = registerNumber;
			existingAlumni.name = name;
			existingAlumni.fatherName = fatherName;
			existingAlumni.email = email;
			existingAlumni.dob = new Date(dob);
			existingAlumni.yearFrom = yearFrom;
			existingAlumni.yearTo = yearTo;
			existingAlumni.degree = degree;
			existingAlumni.branch = branch;
			existingAlumni.presentAddress = presentAddress;
			existingAlumni.permanentAddress = permanentAddress;
			existingAlumni.hasCompetitiveExams = hasCompetitiveExams;
			existingAlumni.competitiveExams = competitiveExams;
			existingAlumni.collegeQualifications = collegeQualifications;
			existingAlumni.placementType = placementType;
			existingAlumni.companyName = companyName;
			existingAlumni.designation = designation;
			existingAlumni.companyAddress = companyAddress;
			existingAlumni.employmentRemarks = employmentRemarks;
			existingAlumni.isEntrepreneur = isEntrepreneur;
			existingAlumni.entrepreneurDetails = entrepreneurDetails;
			existingAlumni.maritalStatus = maritalStatus;
			existingAlumni.spouseDetails = spouseDetails;
			existingAlumni.extraCurricular = extraCurricular;
			existingAlumni.otherInfo = otherInfo;
			existingAlumni.knownAlumni = knownAlumni;
			if (signature) {
				existingAlumni.signature = signature;
			}

			await existingAlumni.save();
			alumni = existingAlumni;
		} else {
			console.log(`New alumni registration for email ${email}. Creating records...`);

			if (existingUser) {
				return res.status(400).json({
					success: false,
					message: 'User account already exists with this email or register number',
				});
			}

			newUser = await User.create({
				userId: registerNumber,
				name,
				email,
				password: hashedPassword,
				role: 'alumni',
			});

			alumni = await Alumni.create({
				userId: newUser._id,
				registerNumber,
				name,
				fatherName,
				email,
				dob: new Date(dob),
				yearFrom,
				yearTo,
				degree,
				branch,
				presentAddress,
				permanentAddress,
				hasCompetitiveExams,
				competitiveExams,
				collegeQualifications,
				placementType,
				companyName,
				designation,
				companyAddress,
				employmentRemarks,
				isEntrepreneur,
				entrepreneurDetails,
				maritalStatus,
				spouseDetails,
				extraCurricular,
				otherInfo,
				knownAlumni,
				signature,
			});
		}

		const userAgent = req.headers['user-agent'] || 'Unknown';
		const ipAddress = req.ip || req.connection?.remoteAddress || 'Unknown';
		await tokenRecord.markAsUsed(userAgent, ipAddress);

		const jwtToken = generateToken({ id: newUser._id.toString(), role: newUser.role });

		res.status(201).json({
			success: true,
			message: 'Registration completed successfully',
			token: jwtToken,
			user: {
				id: newUser._id,
				userId: newUser.userId,
				name: newUser.name,
				email: newUser.email,
				role: newUser.role,
			},
		});
	} catch (error: any) {
		if (error.name === 'ValidationError') {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}
		console.error('Error submitting registration:', error);
		res.status(500).json({
			success: false,
			message: 'Server error',
		});
	}
};

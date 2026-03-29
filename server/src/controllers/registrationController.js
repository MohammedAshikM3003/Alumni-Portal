import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import RegistrationToken from '../models/registrationToken.js';
import User from '../models/user.js';
import Alumni from '../models/alumni.js';
import { generateToken } from '../security/jwt.js';
import createTransporter from '../utils/mailer.js';

const normalizeBaseUrl = (url) => String(url || '').replace(/\/+$/, '');

const createTraceId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const getErrorDebugInfo = (error) => ({
	message: error?.message || 'Unknown error',
	code: error?.code || null,
	command: error?.command || null,
	responseCode: error?.responseCode || null,
	response: error?.response || null,
	stack: error?.stack ? error.stack.split('\n').slice(0, 3).join(' | ') : null,
});

const logStep = (traceId, flow, step, details = {}) => {
	console.log(`[RegistrationMail:${traceId}][${flow}][Step ${step}]`, details);
};

const logBreak = (traceId, flow, step, reason, details = {}) => {
	console.warn(`[RegistrationMail:${traceId}][${flow}][BREAK at Step ${step}] ${reason}`, details);
};

const sendStepFailure = (res, status, traceId, flow, step, message, extra = {}) => {
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
 * POST /api/registration/send-links
 */
export const sendRegistrationLinks = async (req, res) => {
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

		// Validate email formats
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const invalidEmails = emails.filter((e) => !emailRegex.test(e));
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

		const sent = [];
		const failed = [];

		for (const [index, email] of emails.entries()) {
			try {
				logStep(traceId, 'send-links', 5, { index, email, message: 'Processing recipient' });
				// Check if user already exists
				const existingUser = await User.findOne({ email: email.toLowerCase() });
				if (existingUser) {
					logBreak(traceId, 'send-links', 6, 'Existing user found', { index, email });
					failed.push({ email, reason: 'User already registered' });
					continue;
				}

				// Check if there's an existing unused token for this email
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

				// Prepare token in memory. Persist only after successful mail send.
				const token = crypto.randomBytes(32).toString('hex');
				const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
				logStep(traceId, 'send-links', 8, {
					index,
					email,
					tokenPrefix: token.slice(0, 8),
					expiresAt,
					message: 'Token prepared in memory (not yet stored)',
				});

				// Create registration link
				const registrationUrl = `${portalBaseUrl}/register/alumni/${token}`;

				// Email content
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

				// Send email
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
			} catch (error) {
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
			return res.status(400).json({
				success: false,
				message: 'No registration links were sent. Please check failed details.',
				sent: 0,
				failed,
				traceId,
				flow: 'send-links',
				step: 11,
				errorCode: 'ALL_SENDS_FAILED',
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
	} catch (error) {
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
 * POST /api/registration/send-single-link
 */
export const sendSingleRegistrationLink = async (req, res) => {
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

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			logBreak(traceId, 'send-single-link', 3, 'Invalid email format', { email });
			return sendStepFailure(res, 400, traceId, 'send-single-link', 3, 'Invalid email format');
		}

		// Check if user already exists
		logStep(traceId, 'send-single-link', 4, { email, message: 'Checking existing user' });
		const existingUser = await User.findOne({ email: email.toLowerCase() });
		if (existingUser) {
			logBreak(traceId, 'send-single-link', 4, 'User already exists', { email });
			return sendStepFailure(res, 400, traceId, 'send-single-link', 4, 'User already registered with this email');
		}

		// Check if there's an existing unused token for this email
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

		// Prepare token in memory. Persist only after successful mail send.
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

		// Create registration link
		const registrationUrl = `${portalBaseUrl}/register/alumni/${token}`;

		// Email content
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

		// Send email
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
	} catch (error) {
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
 * POST /api/registration/send-prefilled-link
 */
export const sendPrefilledRegistrationLink = async (req, res) => {
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

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			logBreak(traceId, 'send-prefilled-link', 4, 'Invalid email format', { email });
			return sendStepFailure(res, 400, traceId, 'send-prefilled-link', 4, 'Invalid email format');
		}

		// Check if user already exists
		logStep(traceId, 'send-prefilled-link', 5, { email, message: 'Checking existing user' });
		const existingUser = await User.findOne({ email: email.toLowerCase() });
		if (existingUser) {
			logBreak(traceId, 'send-prefilled-link', 5, 'User already exists', { email });
			return sendStepFailure(res, 400, traceId, 'send-prefilled-link', 5, 'User already registered with this email');
		}

		// Check if there's an existing unused token for this email
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

		// Prepare token in memory. Persist only after successful mail send.
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

		// Create registration link
		const registrationUrl = `${portalBaseUrl}/register/alumni/${token}`;

		// Email content
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

		// Send email
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
	} catch (error) {
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
 * GET /api/registration/validate/:token
 */
export const validateRegistrationToken = async (req, res) => {
	try {
		const { token } = req.params;

		if (!token) {
			return res.status(400).json({
				success: false,
				message: 'Token is required',
			});
		}

		const tokenRecord = await RegistrationToken.findValidToken(token);

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
 * POST /api/registration/submit/:token
 */
export const submitRegistration = async (req, res) => {
	try {
		const { token } = req.params;
		const {
			// Credentials
			password,
			confirmPassword,

			// Required fields
			registerNumber,
			name,
			dob,
			yearFrom,
			yearTo,
			degree,
			branch,

			// Optional fields
			fatherName,
			presentAddress,
			permanentAddress,
			hasCompetitiveExams,
			competitiveExams,
			collegeQualifications,
			placementType,
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

		// Validate token
		const tokenRecord = await RegistrationToken.findValidToken(token);
		if (!tokenRecord) {
			return res.status(401).json({
				success: false,
				message: 'Invalid, expired, or already used registration link',
			});
		}

		const email = tokenRecord.email;

		// Validate passwords
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

		// Validate required fields
		if (!registerNumber || !name || !dob || !yearFrom || !yearTo || !degree || !branch) {
			return res.status(400).json({
				success: false,
				message: 'Required fields are missing (registerNumber, name, dob, yearFrom, yearTo, degree, branch)',
			});
		}

		// Check if alumni already exists by email or register number
		let existingAlumni = await Alumni.findOne({
			$or: [{ email }, { registerNumber }],
		});

		// Check if user account already exists
		let existingUser = await User.findOne({
			$or: [{ email }, { userId: registerNumber }],
		});

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 12);

		let newUser;
		let alumni;

		if (existingAlumni) {
			// Alumni record exists - UPDATE scenario
			console.log(`Alumni exists for email ${email}. Updating record...`);

			// If user account doesn't exist, create it
			if (!existingUser) {
				newUser = await User.create({
					userId: registerNumber,
					name,
					email,
					password: hashedPassword,
					role: 'alumni',
				});

				// Link user to alumni record
				existingAlumni.userId = newUser._id;
			} else {
				// User exists - update password if different
				existingUser.password = hashedPassword;
				existingUser.name = name;
				await existingUser.save();
				newUser = existingUser;
			}

			// Update alumni record with all submitted data
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
			// New registration - CREATE scenario
			console.log(`New alumni registration for email ${email}. Creating records...`);

			// Check if user with this email/registerNumber exists (shouldn't happen normally)
			if (existingUser) {
				return res.status(400).json({
					success: false,
					message: 'User account already exists with this email or register number',
				});
			}

			// Create User account
			newUser = await User.create({
				userId: registerNumber,
				name,
				email,
				password: hashedPassword,
				role: 'alumni',
			});

			// Create Alumni record
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

		// Mark token as used
		const userAgent = req.headers['user-agent'] || 'Unknown';
		const ipAddress = req.ip || req.connection?.remoteAddress || 'Unknown';
		await tokenRecord.markAsUsed(userAgent, ipAddress);

		// Generate JWT for auto-login
		const jwtToken = generateToken({ id: newUser._id, role: newUser.role });

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
	} catch (error) {
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

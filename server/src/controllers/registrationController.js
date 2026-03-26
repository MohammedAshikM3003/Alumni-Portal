import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import RegistrationToken from '../models/registrationToken.js';
import User from '../models/user.js';
import Alumni from '../models/alumni.js';
import { generateToken } from '../security/jwt.js';

// Create a transporter using Gmail SMTP
const createTransporter = () => {
	return nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_APP_PASSWORD,
		},
	});
};

/**
 * Send registration links to multiple emails
 * POST /api/registration/send-links
 */
export const sendRegistrationLinks = async (req, res) => {
	try {
		const { emails } = req.body;

		if (!emails || !Array.isArray(emails) || emails.length === 0) {
			return res.status(400).json({
				success: false,
				message: 'Please provide an array of emails',
			});
		}

		// Validate email formats
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const invalidEmails = emails.filter((e) => !emailRegex.test(e));
		if (invalidEmails.length > 0) {
			return res.status(400).json({
				success: false,
				message: `Invalid email format: ${invalidEmails.join(', ')}`,
			});
		}

		const transporter = createTransporter();
		const portalBaseUrl = process.env.PORTAL_URL || 'http://localhost:5173';

		const sent = [];
		const failed = [];

		for (const email of emails) {
			try {
				// Check if user already exists
				const existingUser = await User.findOne({ email: email.toLowerCase() });
				if (existingUser) {
					failed.push({ email, reason: 'User already registered' });
					continue;
				}

				// Check if there's an existing unused token for this email
				const existingToken = await RegistrationToken.findOne({
					email: email.toLowerCase(),
					isUsed: false,
					expiresAt: { $gt: new Date() },
				});

				if (existingToken) {
					failed.push({ email, reason: 'Registration link already sent' });
					continue;
				}

				// Create new token (2-day expiry)
				const tokenRecord = await RegistrationToken.createToken(email.toLowerCase());

				// Create registration link
				const registrationUrl = `${portalBaseUrl}/register/alumni/${tokenRecord.token}`;

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
				await transporter.sendMail({
					from: `"Alumni Portal" <${process.env.EMAIL_USER}>`,
					to: email,
					subject: 'Complete Your Alumni Portal Registration',
					html: emailHtml,
				});

				sent.push(email);
			} catch (error) {
				console.error(`Failed to send to ${email}:`, error.message);
				failed.push({ email, reason: error.message });
			}
		}

		res.status(200).json({
			success: true,
			message: `Sent ${sent.length} registration link(s)`,
			sent: sent.length,
			failed: failed,
		});
	} catch (error) {
		console.error('Error sending registration links:', error);
		res.status(500).json({
			success: false,
			message: 'Server error',
		});
	}
};

/**
 * Send registration link to single email (Admin form)
 * POST /api/registration/send-single-link
 */
export const sendSingleRegistrationLink = async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({
				success: false,
				message: 'Email is required',
			});
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid email format',
			});
		}

		// Check if user already exists
		const existingUser = await User.findOne({ email: email.toLowerCase() });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: 'User already registered with this email',
			});
		}

		// Check if there's an existing unused token for this email
		const existingToken = await RegistrationToken.findOne({
			email: email.toLowerCase(),
			isUsed: false,
			expiresAt: { $gt: new Date() },
		});

		if (existingToken) {
			return res.status(400).json({
				success: false,
				message: 'Registration link already sent to this email. Please check inbox.',
			});
		}

		// Create new token (2-day expiry)
		const tokenRecord = await RegistrationToken.createToken(email.toLowerCase());

		const transporter = createTransporter();
		const portalBaseUrl = process.env.PORTAL_URL || 'http://localhost:5173';

		// Create registration link
		const registrationUrl = `${portalBaseUrl}/register/alumni/${tokenRecord.token}`;

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
		await transporter.sendMail({
			from: `"Alumni Portal" <${process.env.EMAIL_USER}>`,
			to: email,
			subject: 'Complete Your Alumni Portal Registration',
			html: emailHtml,
		});

		res.status(200).json({
			success: true,
			message: `Registration link sent successfully to ${email}`,
		});
	} catch (error) {
		console.error('Error sending registration link:', error);
		res.status(500).json({
			success: false,
			message: 'Server error',
		});
	}
};

/**
 * Send registration link with pre-filled data (Admin form with details)
 * POST /api/registration/send-prefilled-link
 */
export const sendPrefilledRegistrationLink = async (req, res) => {
	try {
		const { email, prefilledData } = req.body;

		if (!email) {
			return res.status(400).json({
				success: false,
				message: 'Email is required',
			});
		}

		if (!prefilledData) {
			return res.status(400).json({
				success: false,
				message: 'Pre-filled data is required',
			});
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid email format',
			});
		}

		// Check if user already exists
		const existingUser = await User.findOne({ email: email.toLowerCase() });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: 'User already registered with this email',
			});
		}

		// Check if there's an existing unused token for this email
		const existingToken = await RegistrationToken.findOne({
			email: email.toLowerCase(),
			isUsed: false,
			expiresAt: { $gt: new Date() },
		});

		if (existingToken) {
			return res.status(400).json({
				success: false,
				message: 'Registration link already sent to this email. Please check inbox.',
			});
		}

		// Create new token with pre-filled data (2-day expiry)
		const tokenRecord = await RegistrationToken.createToken(email.toLowerCase(), prefilledData);

		const transporter = createTransporter();
		const portalBaseUrl = process.env.PORTAL_URL || 'http://localhost:5173';

		// Create registration link
		const registrationUrl = `${portalBaseUrl}/register/alumni/${tokenRecord.token}`;

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
		await transporter.sendMail({
			from: `"Alumni Portal" <${process.env.EMAIL_USER}>`,
			to: email,
			subject: 'Complete Your Alumni Portal Registration',
			html: emailHtml,
		});

		res.status(200).json({
			success: true,
			message: `Registration link with pre-filled data sent successfully to ${email}`,
		});
	} catch (error) {
		console.error('Error sending pre-filled registration link:', error);
		res.status(500).json({
			success: false,
			message: 'Server error',
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

		// Check if user already exists
		const existingUser = await User.findOne({
			$or: [{ email }, { userId: registerNumber }],
		});
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: 'User with this email or register number already exists',
			});
		}

		// Check if alumni already exists
		const existingAlumni = await Alumni.findOne({ registerNumber });
		if (existingAlumni) {
			return res.status(400).json({
				success: false,
				message: 'Alumni with this register number already exists',
			});
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Create User account
		const newUser = await User.create({
			userId: registerNumber,
			name,
			email,
			password: hashedPassword,
			role: 'alumni',
		});

		// Create Alumni record
		const alumni = await Alumni.create({
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

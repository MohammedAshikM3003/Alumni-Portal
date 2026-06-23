import type { Request, Response } from 'express';
import User from '../models/user.js';
import { hashPassword, comparePassword } from '../security/bcrypt.js';
import { generateToken } from '../security/jwt.js';
import { generateOtp, sendOtpEmail, OTP_TTL_MINUTES } from '../utils/emailOtp.js';

const OTP_EXPIRY_MS = OTP_TTL_MINUTES * 60 * 1000;

const getUserEmail = (value: unknown): string => String(value || '').trim().toLowerCase();

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
	try {
		const email = getUserEmail(req.body?.email);

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			res.status(400).json({ success: false, message: 'Valid registered email is required' });
			return;
		}

		const user = await User.findOne({ email });

		if (!user) {
			res.status(404).json({ success: false, message: 'No account found for this email address' });
			return;
		}

		const otp = generateOtp();
		user.resetOtp = await hashPassword(otp);
		user.resetOtpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
		user.resetOtpVerifiedAt = undefined;
		await user.save();

		await sendOtpEmail({
			to: user.email,
			recipientName: user.name,
			otp,
			subject: 'Alumni Portal password reset code',
			purpose: 'reset your password',
		});

		res.status(200).json({
			success: true,
			message: 'Verification code sent to your registered email address',
		});
	} catch (error) {
		console.error('[EmailOtpController] sendOtp error:', error);
		res.status(500).json({ success: false, message: 'Failed to send OTP' });
	}
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
	try {
		const email = getUserEmail(req.body?.email);
		const code = String(req.body?.code || '').trim();

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			res.status(400).json({ success: false, message: 'Valid registered email is required' });
			return;
		}

		if (!code || !/^\d{6}$/.test(code)) {
			res.status(400).json({ success: false, message: 'OTP must be a 6-digit code' });
			return;
		}

		const user = await User.findOne({ email });

		if (!user || !user.resetOtp || !user.resetOtpExpiry) {
			res.status(400).json({ success: false, message: 'No OTP request found. Please request a new code.' });
			return;
		}

		if (new Date(user.resetOtpExpiry).getTime() < Date.now()) {
			user.resetOtp = undefined;
			user.resetOtpExpiry = undefined;
			user.resetOtpVerifiedAt = undefined;
			await user.save();

			res.status(400).json({ success: false, message: 'OTP expired. Please request a new code.' });
			return;
		}

		const isValid = await comparePassword(code, user.resetOtp);
		if (!isValid) {
			res.status(400).json({ success: false, message: 'Invalid OTP code' });
			return;
		}

		user.resetOtpVerifiedAt = new Date();
		user.resetOtp = undefined;
		user.resetOtpExpiry = undefined;
		await user.save();

		const token = generateToken({ id: user._id, role: user.role });

		res.status(200).json({
			success: true,
			message: 'OTP verified successfully',
			token,
			user: {
				id: user._id,
				userId: user.userId,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		});
	} catch (error) {
		console.error('[EmailOtpController] verifyOtp error:', error);
		res.status(500).json({ success: false, message: 'Failed to verify OTP' });
	}
};

export const resendOtp = async (req: Request, res: Response): Promise<void> => {
	try {
		const email = getUserEmail(req.body?.email);

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			res.status(400).json({ success: false, message: 'Valid registered email is required' });
			return;
		}

		const user = await User.findOne({ email });
		if (!user) {
			res.status(404).json({ success: false, message: 'No account found for this email address' });
			return;
		}

		const otp = generateOtp();
		user.resetOtp = await hashPassword(otp);
		user.resetOtpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
		user.resetOtpVerifiedAt = undefined;
		await user.save();

		await sendOtpEmail({
			to: user.email,
			recipientName: user.name,
			otp,
			subject: 'Alumni Portal password reset code',
			purpose: 'reset your password',
		});

		res.status(200).json({ success: true, message: 'Verification code resent successfully' });
	} catch (error) {
		console.error('[EmailOtpController] resendOtp error:', error);
		res.status(500).json({ success: false, message: 'Failed to resend OTP' });
	}
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
	try {
		const email = getUserEmail(req.body?.email);
		const newPassword = String(req.body?.newPassword || '');
		const confirmPassword = String(req.body?.confirmPassword || '');

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			res.status(400).json({ success: false, message: 'Valid registered email is required' });
			return;
		}

		if (!newPassword || !confirmPassword) {
			res.status(400).json({ success: false, message: 'Both password fields are required' });
			return;
		}

		if (newPassword !== confirmPassword) {
			res.status(400).json({ success: false, message: 'Passwords do not match' });
			return;
		}

		if (newPassword.length < 6) {
			res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
			return;
		}

		const user = await User.findOne({ email });
		if (!user || !user.resetOtpVerifiedAt) {
			res.status(400).json({ success: false, message: 'Please verify OTP first' });
			return;
		}

		const verificationTime = new Date(user.resetOtpVerifiedAt);
		if (Date.now() - verificationTime.getTime() > OTP_EXPIRY_MS) {
			user.resetOtpVerifiedAt = undefined;
			await user.save();
			res.status(400).json({ success: false, message: 'OTP verification expired. Please request a new code.' });
			return;
		}

		user.password = await hashPassword(newPassword);
		user.resetOtpVerifiedAt = undefined;
		await user.save();

		res.status(200).json({ success: true, message: 'Password reset successfully' });
	} catch (error) {
		console.error('[EmailOtpController] resetPassword error:', error);
		res.status(500).json({ success: false, message: 'Failed to reset password' });
	}
};
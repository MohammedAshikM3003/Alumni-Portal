import { Router } from 'express';
import { login, googleLogin } from '../controllers/authController.js';
import { sendOtp, verifyOtp, resendOtp, resetPassword } from '../controllers/emailOtpController.js';

const router = Router();

// Traditional login routes
router.post('/login', login);
router.post('/google-login', googleLogin);

// Email OTP authentication routes
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/reset-password', resetPassword);

export default router;
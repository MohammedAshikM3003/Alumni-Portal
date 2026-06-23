import createTransporter from './mailer.js';

export const OTP_TTL_MINUTES = 10;

export const generateOtp = (): string => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

const escapeHtml = (value: string): string =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

export const sendOtpEmail = async (options: {
	to: string;
	recipientName?: string;
	otp: string;
	subject?: string;
	purpose?: string;
}): Promise<void> => {
	const transporter = await createTransporter();
	const recipientName = options.recipientName?.trim() || 'User';
	const subject = options.subject || 'Your Alumni Portal verification code';
	const purpose = options.purpose || 'reset your password';
	const safeName = escapeHtml(recipientName);
	const safeOtp = escapeHtml(options.otp);
	const safePurpose = escapeHtml(purpose);

	const html = `
		<div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px; color:#0f172a;">
			<div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:20px; overflow:hidden;">
				<div style="padding:28px 32px; background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%); color:#ffffff;">
					<p style="margin:0 0 8px; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; opacity:0.8;">Alumni Portal</p>
					<h1 style="margin:0; font-size:24px; line-height:1.2;">Verification Code</h1>
				</div>
				<div style="padding:32px;">
					<p style="margin:0 0 16px; font-size:15px; line-height:1.7;">Hello ${safeName},</p>
					<p style="margin:0 0 24px; font-size:15px; line-height:1.7; color:#334155;">
						Use the code below to ${safePurpose}. This code expires in ${OTP_TTL_MINUTES} minutes.
					</p>
					<div style="display:inline-block; padding:16px 24px; border-radius:14px; background:#f8fafc; border:1px solid #cbd5e1; font-size:32px; font-weight:800; letter-spacing:0.24em; color:#0f172a;">
						${safeOtp}
					</div>
					<p style="margin:24px 0 0; font-size:13px; color:#64748b; line-height:1.6;">
						If you did not request this code, you can safely ignore this email.
					</p>
				</div>
			</div>
		</div>
	`;

	await transporter.sendMail({
		from: `Alumni Portal <${process.env.EMAIL_USER}>`,
		to: options.to,
		subject,
		html,
	});
};
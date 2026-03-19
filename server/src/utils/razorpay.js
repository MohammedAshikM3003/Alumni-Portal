import Razorpay from 'razorpay';
import crypto from 'node:crypto';

let razorpayClient;

const getRazorpayClient = () => {
	if (razorpayClient) {
		return razorpayClient;
	}

	const keyId = process.env.RAZORPAY_KEY_ID;
	const keySecret = process.env.RAZORPAY_KEY_SECRET;

	if (!keyId || !keySecret) {
		throw new Error('Razorpay keys are not configured');
	}

	razorpayClient = new Razorpay({
		key_id: keyId,
		key_secret: keySecret,
	});

	return razorpayClient;
};

const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
	const keySecret = process.env.RAZORPAY_KEY_SECRET;
	if (!keySecret) {
		return false;
	}

	const expectedSignature = crypto
		.createHmac('sha256', keySecret)
		.update(`${orderId}|${paymentId}`)
		.digest('hex');

	try {
		return crypto.timingSafeEqual(
			Buffer.from(expectedSignature),
			Buffer.from(signature || '')
		);
	} catch {
		return false;
	}
};

export { getRazorpayClient, verifyRazorpaySignature };

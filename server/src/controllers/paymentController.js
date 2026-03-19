import Payment from '../models/payment.js';
import { getRazorpayClient, verifyRazorpaySignature } from '../utils/razorpay.js';

const ALLOWED_METHODS = new Set(['upi', 'card', 'netbanking']);

export const createOrder = async (req, res) => {
	try {
		const { amount, method = 'upi', purpose = '' } = req.body;

		const numericAmount = Number(amount);
		if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
			return res.status(400).json({ success: false, message: 'Enter a valid amount' });
		}

		const trimmedPurpose = String(purpose).trim();
		if (!trimmedPurpose) {
			return res.status(400).json({ success: false, message: 'Donation purpose is required' });
		}

		if (trimmedPurpose.length > 200) {
			return res.status(400).json({ success: false, message: 'Donation purpose must be within 200 characters' });
		}

		if (!ALLOWED_METHODS.has(method)) {
			return res.status(400).json({ success: false, message: 'Invalid payment method' });
		}

		const amountInPaise = Math.round(numericAmount * 100);
		const razorpay = getRazorpayClient();
		const shortUserId = String(req.user._id).slice(-8);
		const receipt = `don_${Date.now()}_${shortUserId}`;

		const order = await razorpay.orders.create({
			amount: amountInPaise,
			currency: 'INR',
			receipt,
			notes: {
				userId: String(req.user._id),
				preferredMethod: method,
				donationPurpose: trimmedPurpose,
			},
		});

		await Payment.create({
			user: req.user._id,
			amount: numericAmount,
			currency: 'INR',
			method,
			purpose: trimmedPurpose,
			status: 'created',
			razorpayOrderId: order.id,
		});

		return res.status(201).json({
			success: true,
			order,
			keyId: process.env.RAZORPAY_KEY_ID,
			amount: numericAmount,
			currency: 'INR',
		});
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message || 'Failed to create order' });
	}
};

export const verifyPayment = async (req, res) => {
	try {
		const {
			razorpay_order_id: orderId,
			razorpay_payment_id: paymentId,
			razorpay_signature: signature,
		} = req.body;

		if (!orderId || !paymentId || !signature) {
			return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
		}

		const isValid = verifyRazorpaySignature({ orderId, paymentId, signature });
		if (!isValid) {
			await Payment.findOneAndUpdate(
				{ razorpayOrderId: orderId },
				{ status: 'failed' },
				{ new: true }
			);

			return res.status(400).json({ success: false, message: 'Invalid payment signature' });
		}

		const payment = await Payment.findOneAndUpdate(
			{ razorpayOrderId: orderId },
			{
				status: 'paid',
				razorpayPaymentId: paymentId,
				razorpaySignature: signature,
				paidAt: new Date(),
			},
			{ new: true }
		);

		return res.status(200).json({ success: true, message: 'Payment verified', payment });
	} catch (error) {
		return res.status(500).json({ success: false, message: error.message || 'Payment verification failed' });
	}
};

export const getMyPayments = async (req, res) => {
	try {
		const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
		return res.status(200).json({ success: true, payments });
	} catch {
		return res.status(500).json({ success: false, message: 'Failed to fetch payments' });
	}
};
